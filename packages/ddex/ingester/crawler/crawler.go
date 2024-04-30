package crawler

import (
	"archive/zip"
	"fmt"
	"ingester/common"
	"ingester/constants"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Crawler struct {
	*common.Ingester
}

// CrawlThenParse periodically checks for new releases in the "raw" S3 bucket and then runs parseRelease on each one
func CrawlThenParse(i *common.Ingester) {
	c := &Crawler{
		Ingester: i,
	}

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
		case <-i.Ctx.Done():
			return
		case <-ticker.C:
			lastPolledStr, err := c.getLastPolledStr()
			if err != nil {
				c.Logger.Error("Failed to retrieve S3 raw bucket's last polled time", "error", err)
				continue
			}

			// Insert batches and releases uploaded to S3 since the last polled time
			lastKey, err := c.pollS3Bucket(lastPolledStr)
			if err != nil {
				c.Logger.Error("Error polling S3 bucket", "error", err)
				continue
			}

			// Update cursor so we don't reprocess the same releases
			if lastKey != "" {
				err = c.updateLastPolledStr(lastKey)
				if err != nil {
					c.Logger.Error("Failed to update s3 bucket's last polled time", "error", err)
				}
			}

			if i.Ctx.Err() != nil {
				return
			}
		}
	}
}

func (c *Crawler) updateLastPolledStr(lastPolledStr string) error {
	filter := bson.M{"service": "crawler"}
	update := bson.M{"$set": bson.M{"s3_raw_last_polled_str": lastPolledStr}}
	opts := options.Update().SetUpsert(true)

	_, err := c.CrawlerCursorColl.UpdateOne(c.Ctx, filter, update, opts)
	return err
}

func (c *Crawler) getLastPolledStr() (string, error) {
	var result struct {
		LastPolledStr string `bson:"s3_raw_last_polled_str"`
	}
	filter := bson.M{"service": "crawler"}

	err := c.CrawlerCursorColl.FindOne(c.Ctx, filter).Decode(&result)
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
func (c *Crawler) pollS3Bucket(lastPolledString string) (lastKey string, err error) {
	input := &s3.ListObjectsV2Input{
		Bucket:     aws.String(c.Bucket),
		StartAfter: aws.String(lastPolledString),
	}

	res, err := c.S3Client.ListObjectsV2(input)
	if err != nil {
		err = fmt.Errorf("error polling S3 bucket: %w", err)
		return
	}

	if len(res.Contents) == 0 {
		return
	}

	lastKey = *res.Contents[len(res.Contents)-1].Key

	for _, item := range res.Contents {
		if strings.HasSuffix(*item.Key, ".xml") {
			// If we have an XML file, insert it into the Mongo releases or batches collection
			if err = c.upsertXML(*item.Key, *item.LastModified); err != nil {
				return
			}
		} else if strings.HasSuffix(*item.Key, ".zip") {
			// If we have a ZIP file, re-upload it as an unzipped folder without messing up the cursor

			// Download the ZIP file to a temp dir
			remotePath := fmt.Sprintf("s3://%s/%s", c.Bucket, *item.Key)
			var deliveryLocalPath string
			deliveryLocalPath, err = os.MkdirTemp("", *item.Key+"-*")
			if err != nil {
				err = fmt.Errorf("error creating temp directory: %w", err)
				return
			}
			defer func() {
				if err := os.RemoveAll(deliveryLocalPath); err != nil {
					c.Logger.Error("Error removing temp directory", "deliveryLocalPath", deliveryLocalPath, "error", err)
				}
			}()
			zipFilePath, cleanup := c.downloadFileFromS3Raw(remotePath)
			defer cleanup()
			if zipFilePath == "" {
				err = fmt.Errorf("failed to download ZIP file from S3 path: %s", remotePath)
				return
			}

			// Unzip
			if err = unzip(zipFilePath, deliveryLocalPath); err != nil {
				err = fmt.Errorf("error unzipping file: %w", err)
				return
			}

			// Re-upload the unzipped contents
			var entries []fs.DirEntry
			entries, err = fs.ReadDir(os.DirFS(deliveryLocalPath), ".")
			if err != nil {
				err = fmt.Errorf("failed to read directory '%s': %w", deliveryLocalPath, err)
				return
			}

			for _, entry := range entries {
				if slices.Contains(constants.SkipFiles, entry.Name()) {
					continue
				}

				fullPath := filepath.Join(deliveryLocalPath, entry.Name())
				if entry.IsDir() {
					_, err = c.UploadDirectory(fullPath, entry.Name())
				} else {
					_, err = c.UploadFile(fullPath, "", entry.Name())
				}
				if err != nil {
					err = fmt.Errorf("error uploading file from '%s': %w", fullPath, err)
					return
				}
			}

			// Insert releases and batches from the unzipped folder
			err = filepath.Walk(deliveryLocalPath, func(path string, info os.FileInfo, err error) error {
				if err != nil {
					return err
				}

				if strings.HasSuffix(info.Name(), ".xml") {
					c.upsertXML(strings.Split(path, deliveryLocalPath+"/")[1], *item.LastModified)
				}

				return nil
			})

			if err != nil {
				return
			}
		}
	}

	return
}

func (c *Crawler) upsertXML(key string, lastModified time.Time) (err error) {
	remotePath := fmt.Sprintf("s3://%s/%s", c.Bucket, key)
	var xmlBytes []byte
	xmlBytes, err = c.readRemoteXML(remotePath)
	if err != nil {
		err = fmt.Errorf("error reading remote XML: %w", err)
		return
	}

	if strings.HasPrefix(filepath.Base(key), "BatchComplete_") {
		// Insert the batch into Mongo
		batchID := strings.TrimSuffix(strings.TrimPrefix(filepath.Base(key), "BatchComplete_"), ".xml")
		batch := common.Batch{
			BatchID:   batchID,
			BatchXML:  primitive.Binary{Data: xmlBytes, Subtype: 0x00},
			CreatedAt: lastModified,
		}
		if _, err = c.UpsertBatch(&batch); err != nil {
			err = fmt.Errorf("error upserting batch: %w", err)
			return
		}

		// Re-parse releases from this batch
		c.ReleasesColl.UpdateMany(c.Ctx, bson.M{"batch_id": batchID}, bson.M{"$set": bson.M{"release_status": constants.ReleaseStatusAwaitingParse}})
	} else {
		release := common.Release{
			ReleaseID:     strings.TrimSuffix(filepath.Base(key), ".xml"),
			XMLRemotePath: remotePath,
			RawXML:        primitive.Binary{Data: xmlBytes, Subtype: 0x00},
			CreatedAt:     lastModified,
			ParseErrors:   []string{},
			PublishErrors: []string{},
			FailureCount:  0,
			ReleaseStatus: constants.ReleaseStatusAwaitingParse,
		}

		// Set the BatchID to the folder name, ie batchID/ReleaseID/ReleaseID.xml
		if c.Ingester.DDEXChoreography == constants.ERNBatched {
			release.BatchID = strings.Split(key, "/")[0]
		}

		// Upsert a release to be parsed
		if _, err = c.UpsertRelease(&release); err != nil {
			err = fmt.Errorf("error upserting release: %w", err)
			return
		}
	}
	return
}

func (c *Crawler) readRemoteXML(remotePath string) ([]byte, error) {
	xmlPath, cleanup := c.downloadFileFromS3Raw(remotePath)
	defer cleanup()
	if xmlPath == "" {
		return nil, fmt.Errorf("failed to download XML file from S3 path: %s", remotePath)
	}

	xmlBytes, err := os.ReadFile(xmlPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read release XML file %s: %w", xmlPath, err)
	}
	return xmlBytes, nil
}

// downloadFileFromS3Raw downloads a file from the S3 "raw" bucket to a temporary file
func (c *Crawler) downloadFileFromS3Raw(remotePath string) (string, func()) {
	if !strings.HasPrefix(remotePath, "s3://"+c.Bucket+"/") {
		c.Logger.Error("Invalid S3 path", "path", remotePath)
		return "", func() {}
	}
	s3Key := strings.TrimPrefix(remotePath, "s3://"+c.Bucket+"/")
	file, err := os.CreateTemp("", "*.zip")
	if err != nil {
		c.Logger.Error("Error creating temp file", "error", err)
		return "", func() {}
	}

	_, err = c.S3Downloader.Download(file, &s3.GetObjectInput{
		Bucket: aws.String(c.Bucket),
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
