package indexer

import (
	"archive/zip"
	"context"
	"fmt"
	"ingester/common"
	"ingester/constants"
	"io"
	"log"
	"log/slog"
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
	s3Downloader   *s3manager.Downloader
	s3Uploader     *s3manager.Uploader
	mongoClient    *mongo.Client
	rawBucket      string
	indexedBucket  string
	deliveriesColl *mongo.Collection
	ctx            context.Context
	logger         *slog.Logger
}

// RunNewIndexer starts the indexer service, which listens for new uploads in the Mongo "uploads" collection and processes them.
func RunNewIndexer(ctx context.Context) {
	logger := slog.With("service", "indexer")
	_, s3Session := common.InitS3Client(logger)
	mongoClient := common.InitMongoClient(ctx, logger)
	defer mongoClient.Disconnect(ctx)
	deliveriesColl := mongoClient.Database("ddex").Collection("deliveries")

	i := &Indexer{
		s3Downloader:   s3manager.NewDownloader(s3Session),
		s3Uploader:     s3manager.NewUploader(s3Session),
		mongoClient:    mongoClient,
		rawBucket:      common.MustGetenv("AWS_BUCKET_RAW"),
		indexedBucket:  common.MustGetenv("AWS_BUCKET_INDEXED"),
		deliveriesColl: deliveriesColl,
		ctx:            ctx,
		logger:         logger,
	}

	uploadsColl := mongoClient.Database("ddex").Collection("uploads")
	pipeline := mongo.Pipeline{bson.D{{Key: "$match", Value: bson.D{{Key: "operationType", Value: "insert"}}}}}
	changeStream, err := uploadsColl.Watch(ctx, pipeline)
	if err != nil {
		panic(err)
	}
	i.logger.Info("Watching collection 'uploads'")
	defer changeStream.Close(ctx)

	for changeStream.Next(ctx) {
		i.processZIP(changeStream)
	}

	if err := changeStream.Err(); err != nil {
		log.Fatal(err)
	}
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
	i.logger.Info("Processing new upload", "_id", upload.ID)

	// Download ZIP file from S3
	uploadETag := upload.UploadETag
	remotePath := upload.Path
	zipFilePath, cleanup := i.downloadFromS3Raw(remotePath)
	defer cleanup()
	if zipFilePath == "" {
		i.logger.Error("Failed to download ZIP file from S3 bucket", "path", remotePath)
		return
	}

	// Unzip the file and process its contents
	extractDir, err := os.MkdirTemp("", "extracted")
	if err != nil {
		i.logger.Error("Error creating temp directory", "error", err)
		return
	}
	defer os.RemoveAll(extractDir)

	if err := unzip(zipFilePath, extractDir); err != nil {
		i.logger.Error("Error unzipping file", "error", err)
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
		if strings.Contains(path, "__MACOSX") {
			return nil
		}
		if info.IsDir() {
			if path == rootDir {
				return nil
			}
			return i.processDelivery(rootDir, path, uploadETag)
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
		i.logger.Info("No XML file found in directory. Skipping", "dir", dir)
		return nil
	}

	// Upload the delivery's audio and images to S3
	for _, file := range files {
		if !file.IsDir() && !strings.HasSuffix(file.Name(), ".xml") {
			filePath := filepath.Join(dir, file.Name())
			i.uploadToS3Indexed(filePath, fmt.Sprintf("%s/%s", deliveryID.Hex(), file.Name()))
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
	if _, err := i.deliveriesColl.InsertOne(i.ctx, deliveryDoc); err != nil {
		return fmt.Errorf("failed to insert XML data into Mongo: %w", err)
	}

	return nil
}

// downloadFromRaw downloads a file from the S3 "raw" bucket to a temporary file.
func (i *Indexer) downloadFromS3Raw(remotePath string) (string, func()) {
	if !strings.HasPrefix(remotePath, "s3://"+i.rawBucket+"/") {
		i.logger.Error("Invalid S3 path", "path", remotePath)
		return "", func() {}
	}
	s3Key := strings.TrimPrefix(remotePath, "s3://"+i.rawBucket+"/")
	file, err := os.CreateTemp("", "*.zip")
	if err != nil {
		i.logger.Error("Error creating temp file", "error", err)
		return "", func() {}
	}

	_, err = i.s3Downloader.Download(file, &s3.GetObjectInput{
		Bucket: aws.String(i.rawBucket),
		Key:    aws.String(s3Key),
	})
	if err != nil {
		i.logger.Error("Error downloading file from S3", "error", err)
		file.Close()
		os.Remove(file.Name())
		return "", func() {}
	}
	file.Close()
	return file.Name(), func() { os.Remove(file.Name()) }
}

// uploadToIndexed uploads a file to the S3 "indexed" bucket.
func (i *Indexer) uploadToS3Indexed(filePath, fileKey string) {
	file, err := os.Open(filePath)
	if err != nil {
		i.logger.Error("Error opening file", "error", err)
		return
	}
	defer file.Close()

	_, err = i.s3Uploader.Upload(&s3manager.UploadInput{
		Bucket: aws.String(i.indexedBucket),
		Key:    aws.String(fileKey),
		Body:   file,
	})
	if err != nil {
		i.logger.Error("Error uploading file to S3", "error", err)
	} else {
		i.logger.Info("Uploaded file to S3", "file", filePath, "key", fileKey)
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
