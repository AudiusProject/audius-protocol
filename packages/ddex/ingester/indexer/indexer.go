package indexer

import (
	"archive/zip"
	"context"
	"errors"
	"fmt"
	"ingester/common"
	"ingester/constants"
	"io"
	"log"
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
)

type Indexer struct {
	*common.BaseIngester
}

// RunNewIndexer starts the indexer service, which listens for new uploads in the Mongo "uploads" collection and processes them.
func RunNewIndexer(ctx context.Context) {
	i := &Indexer{
		BaseIngester: common.NewBaseIngester(ctx, "indexer"),
	}
	defer i.MongoClient.Disconnect(ctx)
	i.ProcessChangeStream(i.UploadsColl, i.processZIP)
}

// processZIP unzips an "upload" into a "delivery" (or multiple deliveries if the ZIP file contains multiple folders with XML files).
func (i *Indexer) processZIP(changeStream *mongo.ChangeStream) {
	// Decode the "upload" from Mongo
	var changeDoc struct {
		FullDocument common.Upload `bson:"fullDocument"`
	}
	if err := changeStream.Decode(&changeDoc); err != nil {
		log.Fatal(err)
	}
	upload := changeDoc.FullDocument
	i.Logger.Info("Processing new upload", "_id", upload.ID)

	// Download ZIP file from S3
	uploadETag := upload.UploadETag
	remotePath := upload.Path
	zipFilePath, cleanup := i.downloadFromS3Raw(remotePath)
	defer cleanup()
	if zipFilePath == "" {
		i.Logger.Error("Failed to download ZIP file from S3 bucket", "path", remotePath)
		return
	}

	// Unzip the file and process its contents
	extractDir, err := os.MkdirTemp("", "extracted")
	if err != nil {
		i.Logger.Error("Error creating temp directory", "error", err)
		return
	}
	defer os.RemoveAll(extractDir)

	if err := unzip(zipFilePath, extractDir); err != nil {
		i.Logger.Error("Error unzipping file", "error", err)
		return
	}

	i.processZIPContents(extractDir, uploadETag)
}

// processZIPContents finds deliveries in rootDir (and its subdirectories), uploads their contents to S3, and inserts them into the MongoDB "deliveries" collection.
func (i *Indexer) processZIPContents(rootDir, uploadETag string) error {
	// The root directory could be the single delivery
	i.processDelivery(rootDir, rootDir, uploadETag)

	// Or it could contain multiple deliveries
	return filepath.Walk(rootDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if strings.Contains(path, "__MACOSX") || strings.Contains(path, ".DS_Store") {
			return nil
		}

		if info.IsDir() {
			if i.processDelivery(rootDir, path, uploadETag) == nil {
				// If XML found, don't recurse into subdirectories
				return filepath.SkipDir
			}
		}
		return nil
	})
}

// processDelivery parses a "delivery" from dir if dir contains an XML file.
func (i *Indexer) processDelivery(rootDir, dir, uploadETag string) error {
	var deliveryID primitive.ObjectID
	var xmlRelativePath string
	var xmlBytes []byte
	files, err := os.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("failed to read directory %s: %w", dir, err)
	}

	// Look for the XML first and make a new deliveryID for it
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".xml") {
			deliveryID = primitive.NewObjectID()
			xmlPath := filepath.Join(dir, file.Name())
			xmlBytes, err = os.ReadFile(xmlPath)
			if err != nil {
				return fmt.Errorf("failed to read XML file %s: %w", xmlPath, err)
			}

			xmlRelativePath, err = filepath.Rel(rootDir, xmlPath)
			if err != nil {
				return fmt.Errorf("failed to compute relative path for %s: %w", xmlPath, err)
			}
			break // Assume only one XML file per directory
		}
	}

	if deliveryID == primitive.NilObjectID {
		i.Logger.Info("No XML file found in directory. Skipping", "dir", dir)
		return errors.New("no XML file found in directory")
	}

	// Upload the delivery's audio and images to S3
	for _, file := range files {
		if !strings.HasSuffix(file.Name(), ".xml") && !strings.HasSuffix(file.Name(), ".DS_Store") {
			filePath := filepath.Join(dir, file.Name())
			relativePath, err := filepath.Rel(dir, filePath) // Calculate relative path from the XML directory
			if err != nil {
				return fmt.Errorf("failed to compute relative path for %s: %w", filePath, err)
			}
			if file.IsDir() {
				i.uploadDirToS3Indexed(filePath, fmt.Sprintf("%s/%s", deliveryID.Hex(), relativePath))
			} else {
				i.uploadFileToS3Indexed(filePath, fmt.Sprintf("%s/%s", deliveryID.Hex(), relativePath))
			}
		}
	}

	// Insert the delivery into the Mongo "deliveries" collection
	deliveryDoc := bson.M{
		"_id":             deliveryID,
		"upload_etag":     uploadETag,
		"delivery_status": constants.DeliveryStatusValidating,
		"xml_file_path":   xmlRelativePath,
		"xml_content":     primitive.Binary{Data: xmlBytes, Subtype: 0x00}, // Store directly as generic binary for high data integrity
		"created_at":      time.Now(),
	}
	if _, err := i.DeliveriesColl.InsertOne(i.Ctx, deliveryDoc); err != nil {
		return fmt.Errorf("failed to insert XML data into Mongo: %w", err)
	}

	return nil
}

// downloadFromRaw downloads a file from the S3 "raw" bucket to a temporary file.
func (i *Indexer) downloadFromS3Raw(remotePath string) (string, func()) {
	if !strings.HasPrefix(remotePath, "s3://"+i.RawBucket+"/") {
		i.Logger.Error("Invalid S3 path", "path", remotePath)
		return "", func() {}
	}
	s3Key := strings.TrimPrefix(remotePath, "s3://"+i.RawBucket+"/")
	file, err := os.CreateTemp("", "*.zip")
	if err != nil {
		i.Logger.Error("Error creating temp file", "error", err)
		return "", func() {}
	}

	_, err = i.S3Downloader.Download(file, &s3.GetObjectInput{
		Bucket: aws.String(i.RawBucket),
		Key:    aws.String(s3Key),
	})
	if err != nil {
		i.Logger.Error("Error downloading file from S3", "error", err)
		file.Close()
		os.Remove(file.Name())
		return "", func() {}
	}
	file.Close()
	return file.Name(), func() { os.Remove(file.Name()) }
}

// uploadDirToS3Indexed uploads all contents of the dir, including nested subdirs, to the S3 "indexed" bucket.
func (i *Indexer) uploadDirToS3Indexed(dirPath, keyPrefix string) {
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
			i.uploadFileToS3Indexed(path, fileKey)
		}
		return nil
	})

	if err != nil {
		i.Logger.Warn("Error walking through the directory", "err", err)
	}
}

// uploadFileToIndexed uploads a file to the S3 "indexed" bucket.
func (i *Indexer) uploadFileToS3Indexed(filePath, fileKey string) {
	file, err := os.Open(filePath)
	if err != nil {
		i.Logger.Error("Error opening file", "error", err)
		return
	}
	defer file.Close()

	_, err = i.S3Uploader.Upload(&s3manager.UploadInput{
		Bucket: aws.String(i.IndexedBucket),
		Key:    aws.String(fileKey),
		Body:   file,
	})
	if err != nil {
		i.Logger.Error("Error uploading file to S3", "error", err)
	} else {
		i.Logger.Info("Uploaded file to S3", "file", filePath, "key", fileKey)
	}
}

// unzip extracts the contents of the zip file at src to the directory at dest.
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
