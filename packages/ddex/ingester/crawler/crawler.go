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
	} else if os.Getenv("IS_DEV") == "true" {
		interval = 5 * time.Second
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			lastPolledStr, err := c.getLastPolledStr()
			if err != nil {
				c.Logger.Error("Failed to retrieve S3 raw bucket's last polled time", "error", err)
				continue
			}

			deliveries, err := c.pollS3Bucket(lastPolledStr)
			if err != nil {
				c.Logger.Error("Error polling S3 bucket", "error", err)
				continue
			}

			for _, delivery := range deliveries {
				err = c.crawlDelivery(delivery)
				if err != nil {
					c.Logger.Error("Error processing ZIP file", "error", err)
				}
			}

			if len(deliveries) > 0 {
				pathWithoutPrefix := strings.TrimPrefix(deliveries[len(deliveries)-1].RemotePath, "s3://"+c.RawBucket+"/")
				err = c.updateLastPolledStr(pathWithoutPrefix)
				if err != nil {
					c.Logger.Error("Failed to update s3 raw bucket's last polled time", "error", err)
				}
			}

			if ctx.Err() != nil {
				return
			}
		}
	}
}

func (c *Crawler) updateLastPolledStr(lastPolledStr string) error {
	filter := bson.M{"service": "crawler"}
	update := bson.M{"$set": bson.M{"s3_raw_last_polled_str": lastPolledStr}}
	opts := options.Update().SetUpsert(true)

	_, err := c.CursorsColl.UpdateOne(c.Ctx, filter, update, opts)
	return err
}

func (c *Crawler) getLastPolledStr() (string, error) {
	var result struct {
		LastPolledStr string `bson:"s3_raw_last_polled_str"`
	}
	filter := bson.M{"service": "crawler"}

	err := c.CursorsColl.FindOne(c.Ctx, filter).Decode(&result)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// No record found, return empty string
			return "", nil
		}
		return "", err
	}

	return result.LastPolledStr, nil
}

// pollS3Bucket lists top-level folders and ZIP files in the S3 bucket, starting after the specified string
func (c *Crawler) pollS3Bucket(lastPolledString string) ([]common.Delivery, error) {
	input := &s3.ListObjectsV2Input{
		Bucket:     aws.String(c.RawBucket),
		Delimiter:  aws.String("/"),
		StartAfter: aws.String(lastPolledString),
	}

	var items []common.Delivery
	res, err := c.S3Client.ListObjectsV2(input)
	if err != nil {
		return nil, fmt.Errorf("error polling S3 bucket: %w", err)
	}

	// Handle top-level ZIP files
	for _, item := range res.Contents {
		if strings.HasSuffix(*item.Key, ".zip") {
			items = append(items, common.Delivery{
				RemotePath:     fmt.Sprintf("s3://%s/%s", c.RawBucket, *item.Key),
				IsFolder:       false,
				CreatedAt:      *item.LastModified,
				DeliveryStatus: constants.DeliveryStatusParsing,
			})
		}
	}

	// Handle top-level directories (common prefixes)
	for _, prefix := range res.CommonPrefixes {
		folderName := strings.TrimSuffix(*prefix.Prefix, "/")
		items = append(items, common.Delivery{
			RemotePath:     fmt.Sprintf("s3://%s/%s", c.RawBucket, folderName),
			IsFolder:       true,
			CreatedAt:      time.Now(), // TODO: This could query the folder's contents to any file's LastModified
			DeliveryStatus: constants.DeliveryStatusParsing,
		})
	}

	return items, nil
}

// crawlDelivery searches a remote "delivery" (S3 folder or S3 ZIP file that crawDelivery will unzip) for one or more "releases"
func (c *Crawler) crawlDelivery(delivery common.Delivery) error {
	// Only insert if a document doesn't already exist with this remotePath
	filter := bson.M{
		"_id": delivery.RemotePath,
	}
	err := c.DeliveriesColl.FindOne(c.Ctx, filter).Decode(&delivery)
	if err == nil {
		c.Logger.Info("Skipping crawling delivery with remotePath that already exists in Mongo", "remotePath", delivery.RemotePath)
		return nil
	}
	if err != mongo.ErrNoDocuments {
		c.Logger.Error("Error querying Mongo to check for existing remotePath", "remotePath", delivery.RemotePath, "error", err)
		return err
	}

	c.Logger.Info("Processing new delivery", "remotePath", delivery.RemotePath)

	// Create temp directory for the delivery's contents (either from ZIP file or folder in S3)
	deliveryLocalPath, err := os.MkdirTemp("", "delivery")
	if err != nil {
		c.Logger.Error("Error creating temp directory", "error", err)
		return err
	}
	defer func() {
		if err := os.RemoveAll(deliveryLocalPath); err != nil {
			c.Logger.Error("Error removing temp directory", "deliveryLocalPath", deliveryLocalPath, "error", err)
		}
	}()

	// Download folder from S3, or download+extract ZIP file from S3
	if delivery.IsFolder {
		err := c.downloadFolderFromS3Raw(delivery.RemotePath, deliveryLocalPath)
		if err != nil {
			c.Logger.Error("Failed to download folder from S3", "path", delivery.RemotePath, "error", err)
			return err
		}
	} else {
		zipFilePath, cleanup := c.downloadFileFromS3Raw(delivery.RemotePath)
		defer cleanup()
		if zipFilePath == "" {
			c.Logger.Error("Failed to download ZIP file from S3", "path", delivery.RemotePath)
			return err
		}

		if err := unzip(zipFilePath, deliveryLocalPath); err != nil {
			c.Logger.Error("Error unzipping file", "error", err)
			return err
		}
	}

	if c.DDEXChoreography == constants.ERNReleaseByRelease {
		releases, err := c.crawlUnzippedReleaseByRelease(deliveryLocalPath)
		if err == nil {
			delivery.Releases = *releases
		} else {
			delivery.ValidationErrors = append(delivery.ValidationErrors, "Error crawling unzipped release-by-release: "+err.Error())
			delivery.DeliveryStatus = constants.DeliveryStatusErrorCrawling
			c.Logger.Error("Error crawling unzipped release-by-release", "error", err)
		}
	} else {
		batches, err := c.crawlUnzippedBatch(deliveryLocalPath)
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

// downloadFolderFromS3Raw downloads all contents of the remote dir, including nested subdirs, to localFolder
func (c *Crawler) downloadFolderFromS3Raw(remoteFolder, localFolder string) error {
	if !strings.HasPrefix(remoteFolder, "s3://"+c.RawBucket+"/") {
		return fmt.Errorf("invalid S3 path: %s", remoteFolder)
	}
	prefix := strings.TrimPrefix(remoteFolder, "s3://"+c.RawBucket+"/")

	// List objects in the folder
	res, err := c.S3Client.ListObjectsV2(&s3.ListObjectsV2Input{
		Bucket: aws.String(c.RawBucket),
		Prefix: aws.String(prefix),
	})
	if err != nil {
		return fmt.Errorf("failed to list objects: %w", err)
	}

	// Download through objects
	for _, obj := range res.Contents {
		localFilePath := filepath.Join(localFolder, *obj.Key) // Use localFolder as the root
		err := c.downloadSingleFile(obj.Key, localFilePath)
		if err != nil {
			return fmt.Errorf("failed to download object %s: %w", *obj.Key, err)
		}
	}

	return nil
}

func (c *Crawler) downloadSingleFile(s3Key *string, localPath string) error {
	// Ensure parent directories exist
	err := os.MkdirAll(filepath.Dir(localPath), 0755)
	if err != nil {
		return fmt.Errorf("failed to create directories: %w", err)
	}

	// Create the local file
	file, err := os.Create(localPath)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	_, err = c.S3Downloader.Download(file, &s3.GetObjectInput{
		Bucket: aws.String(c.RawBucket),
		Key:    s3Key,
	})
	if err != nil {
		return fmt.Errorf("failed to download file from S3: %w", err)
	}

	return nil
}

// downloadFileFromS3Raw downloads a file from the S3 "raw" bucket to a temporary file
func (c *Crawler) downloadFileFromS3Raw(remotePath string) (string, func()) {
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
		c.Logger.Error("Error downloading file from S3", remotePath, "remotePath", "error", err)
		file.Close()
		os.Remove(file.Name())
		return "", func() {}
	}
	file.Close()
	return file.Name(), func() { os.Remove(file.Name()) }
}

// uploadDirToS3Crawled uploads all contents of the dir, including nested subdirs, to the S3 "crawled" bucket
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

// uploadFileToCrawled uploads a file to the S3 "crawled" bucket
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
