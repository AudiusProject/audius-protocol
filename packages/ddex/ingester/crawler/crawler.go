package crawler

import (
	"archive/zip"
	"context"
	"fmt"
	"ingester/common"
	"ingester/constants"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Crawler struct {
	*common.BaseIngester
}

// RunNewCrawler periodically checks for new ZIP files in the "raw" S3 bucket and crawls them to find releases
func RunNewCrawler(ctx context.Context) {
	c := &Crawler{
		BaseIngester: common.NewBaseIngester(ctx, "crawler"),
	}
	defer c.MongoClient.Disconnect(ctx)

	interval := 3 * time.Minute
	if os.Getenv("TEST_MODE") == "true" {
		interval = time.Second
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			lastPolledTime, err := c.getLastPolledTime()
			if err != nil {
				c.Logger.Error("Failed to retrieve S3 raw bucket's last polled time", "error", err)
				continue
			}

			zipFiles, err := c.pollS3Bucket(lastPolledTime)
			if err != nil {
				c.Logger.Error("Error polling S3 bucket", "error", err)
				continue
			}

			for _, zipFile := range zipFiles {
				err = c.processZIP(zipFile)
				if err != nil {
					c.Logger.Error("Error processing ZIP file", "error", err)
				}
			}

			err = c.updateLastPolledTime(time.Now())
			if err != nil {
				c.Logger.Error("Failed to update s3 raw bucket's last polled time", "error", err)
			}

			if ctx.Err() != nil {
				return
			}
		}
	}
}

func (c *Crawler) updateLastPolledTime(lastPolledTime time.Time) error {
	filter := bson.M{"service": "crawler"}
	update := bson.M{"$set": bson.M{"s3RawLastPolledTime": lastPolledTime}}
	opts := options.Update().SetUpsert(true)

	_, err := c.CursorsColl.UpdateOne(c.Ctx, filter, update, opts)
	return err
}

func (c *Crawler) getLastPolledTime() (time.Time, error) {
	var result struct {
		LastPolledTime time.Time `bson:"s3RawLastPolledTime"`
	}
	filter := bson.M{"service": "crawler"}

	err := c.CursorsColl.FindOne(c.Ctx, filter).Decode(&result)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// No record found, return zero time
			return time.Time{}, nil
		}
		return time.Time{}, err
	}

	return result.LastPolledTime, nil
}

// TODO: If deliveries contain a timestamp in their name, we should be able to use that to avoid querying the entire bucket
func (c *Crawler) pollS3Bucket(lastPolledTime time.Time) ([]*s3.Object, error) {
	resp, err := c.S3Client.ListObjectsV2(&s3.ListObjectsV2Input{
		Bucket: aws.String(c.RawBucket),
	})
	if err != nil {
		return nil, err
	}

	var newUploads []*s3.Object
	for _, item := range resp.Contents {
		if item.LastModified.After(lastPolledTime) {
			newUploads = append(newUploads, item)
		}
	}
	return newUploads, nil
}

// processZIP unzips a "delivery" and crawls it to find one or more "releases"
func (c *Crawler) processZIP(upload *s3.Object) error {
	remotePath := "s3://" + c.RawBucket + "/" + *upload.Key
	etag := strings.Trim(*upload.ETag, "\"")

	// Only insert if a document doesn't already exist with this ETag
	var delivery common.Delivery
	filter := bson.M{
		"_id": etag,
	}
	err := c.DeliveriesColl.FindOne(c.Ctx, filter).Decode(&delivery)
	if err == nil {
		c.Logger.Info("Skipping crawling delivery with ETag that already exists", "etag", etag)
		return nil
	}
	if err != mongo.ErrNoDocuments {
		c.Logger.Error("Error querying Mongo to check for existing ETag", "error", err)
		return err
	}

	c.Logger.Info("Processing new ZIP file", "remotePath", remotePath, "etag", etag)

	delivery = common.Delivery{
		ZIPFileETag:    etag,
		ZIPFilePath:    remotePath,
		CreatedAt:      *upload.LastModified,
		DeliveryStatus: constants.DeliveryStatusParsing,
	}

	// Download ZIP file from S3
	zipFilePath, cleanup := c.downloadFromS3Raw(remotePath)
	defer cleanup()
	if zipFilePath == "" {
		c.Logger.Error("Failed to download ZIP file from S3 bucket", "path", remotePath)
		return err
	}

	// Unzip the file and crawl its contents
	extractDir, err := os.MkdirTemp("", "extracted")
	if err != nil {
		c.Logger.Error("Error creating temp directory", "error", err)
		return err
	}
	defer os.RemoveAll(extractDir)

	if err := unzip(zipFilePath, extractDir); err != nil {
		c.Logger.Error("Error unzipping file", "error", err)
		return err
	}

	if c.DDEXChoreography == constants.ERNReleaseByRelease {
		releases, err := c.crawlUnzippedReleaseByRelease(extractDir)
		if err == nil {
			delivery.Releases = *releases
		} else {
			delivery.ValidationErrors = append(delivery.ValidationErrors, "Error crawling unzipped release-by-release: "+err.Error())
			delivery.DeliveryStatus = constants.DeliveryStatusErrorCrawling
			c.Logger.Error("Error crawling unzipped release-by-release", "error", err)
		}
	} else {
		batches, err := c.crawlUnzippedBatch(extractDir)
		if err == nil {
			delivery.Batches = *batches
		} else {
			delivery.ValidationErrors = append(delivery.ValidationErrors, "Error crawling unzipped batch: "+err.Error())
			delivery.DeliveryStatus = constants.DeliveryStatusErrorCrawling
			c.Logger.Error("Error crawling unzipped batch", "error", err)
		}
	}

	// Insert the delivery into Mongo
	_, err = c.DeliveriesColl.InsertOne(c.Ctx, delivery)
	if err != nil {
		c.Logger.Error("Error inserting delivery into Mongo", "error", err)
		return err
	}

	return nil
}

// getRelease uploads a release's assets to the S3 "crawled" bucket and stores metadata, including XML, in Mongo
func (c *Crawler) getReleaseAndUploadAssets(rootDir, dir string) (*common.UnprocessedRelease, error) {
	// Find the <releaseID>.xml, which should match the directory name
	// TODO: Technically the folder could start with P_ or N_ to indicate priority or not priority and end with _<datetime>, but our current examples don't have this.
	// See https://ernccloud.ddex.net/electronic-release-notification-message-suite-part-3%253A-choreographies-for-cloud-based-storage/5-release-by-release-profile/5.2-file-server-organisation/
	releaseID := filepath.Base(dir)
	xmlPath := filepath.Join(dir, fmt.Sprintf("%s.xml", releaseID))
	if _, err := os.Stat(xmlPath); err != nil {
		return nil, fmt.Errorf("failed to find release XML file %s: %w", xmlPath, err)
	}

	xmlBytes, err := os.ReadFile(xmlPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read release XML file %s: %w", xmlPath, err)
	}

	xmlRelativePath, err := filepath.Rel(rootDir, xmlPath)
	if err != nil {
		return nil, fmt.Errorf("failed to compute relative path for %s: %w", xmlPath, err)
	}

	release := &common.UnprocessedRelease{
		ReleaseID:        releaseID,
		XmlFilePath:      xmlRelativePath,
		XmlContent:       primitive.Binary{Data: xmlBytes, Subtype: 0x00},
		ValidationErrors: []string{},
	}

	// Upload the release's audio and images to the S3 "crawled" bucket
	files, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory %s: %w", dir, err)
	}
	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".xml") || strings.HasSuffix(file.Name(), ".DS_Store") {
			continue
		}
		filePath := filepath.Join(dir, file.Name())
		if strings.Contains(filePath, "__MACOSX") {
			continue
		}

		// Calculate relative path from the release's directory to the file
		relativePath, err := filepath.Rel(dir, filePath)
		if err != nil {
			return release, fmt.Errorf("failed to compute relative path for %s: %w", filePath, err)
		}
		if file.IsDir() {
			// TODO: For updates we need to make sure we don't overwrite an existing resources/ dir with an empty one
			c.uploadDirToS3Crawled(filePath, fmt.Sprintf("%s/%s", releaseID, relativePath))
		} else {
			c.uploadFileToS3Crawled(filePath, fmt.Sprintf("%s/%s", releaseID, relativePath))
		}
	}

	return release, nil
}

// downloadFromRaw downloads a file from the S3 "raw" bucket to a temporary file
func (c *Crawler) downloadFromS3Raw(remotePath string) (string, func()) {
	if !strings.HasPrefix(remotePath, "s3://"+c.RawBucket+"/") {
		c.Logger.Error("Invalid S3 path", "path", remotePath)
		return "", func() {}
	}
	s3Key := strings.TrimPrefix(remotePath, "s3://"+c.RawBucket+"/")
	file, err := os.CreateTemp("", "*.zip")
	if err != nil {
		c.Logger.Error("Error creating temp file", "error", err)
		return "", func() {}
	}

	_, err = c.S3Downloader.Download(file, &s3.GetObjectInput{
		Bucket: aws.String(c.RawBucket),
		Key:    aws.String(s3Key),
	})
	if err != nil {
		c.Logger.Error("Error downloading file from S3", "error", err)
		file.Close()
		os.Remove(file.Name())
		return "", func() {}
	}
	file.Close()
	return file.Name(), func() { os.Remove(file.Name()) }
}

// uploadDirToS3Crawled uploads all contents of the dir, including nested subdirs, to the S3 "crawled" bucket.
func (c *Crawler) uploadDirToS3Crawled(dirPath, keyPrefix string) {
	err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && !strings.HasSuffix(info.Name(), ".DS_Store") {
			relativePath, err := filepath.Rel(dirPath, path)
			if err != nil {
				return err
			}
			fileKey := fmt.Sprintf("%s/%s", keyPrefix, strings.ReplaceAll(relativePath, string(filepath.Separator), "/"))
			c.uploadFileToS3Crawled(path, fileKey)
		}
		return nil
	})

	if err != nil {
		c.Logger.Warn("Error walking through the directory", "err", err)
	}
}

// uploadFileToCrawled uploads a file to the S3 "crawled" bucket.
func (c *Crawler) uploadFileToS3Crawled(filePath, fileKey string) {
	file, err := os.Open(filePath)
	if err != nil {
		c.Logger.Error("Error opening file", "error", err)
		return
	}
	defer file.Close()

	_, err = c.S3Uploader.Upload(&s3manager.UploadInput{
		Bucket: aws.String(c.CrawledBucket),
		Key:    aws.String(fileKey),
		Body:   file,
	})
	if err != nil {
		c.Logger.Error("Error uploading file to S3", "error", err)
	} else {
		c.Logger.Info("Uploaded file to S3", "file", filePath, "key", fileKey)
	}
}

// unzip extracts the contents of the zip file at src to the directory at dest
func unzip(src, dest string) error {
	r, err := zip.OpenReader(src)
	if err != nil {
		return err
	}
	defer r.Close()

	for _, f := range r.File {
		fpath := filepath.Join(dest, f.Name)
		if f.FileInfo().IsDir() {
			os.MkdirAll(fpath, os.ModePerm)
		} else {
			if err = os.MkdirAll(filepath.Dir(fpath), os.ModePerm); err != nil {
				return err
			}
			outFile, err := os.OpenFile(fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
			if err != nil {
				return err
			}
			rc, err := f.Open()
			if err != nil {
				return err
			}
			_, err = io.Copy(outFile, rc)

			// Close the file without deferring to ensure we don't open too many files
			outFile.Close()
			rc.Close()

			if err != nil {
				return err
			}
		}
	}
	return nil
}
