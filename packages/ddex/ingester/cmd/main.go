package main

import (
	"context"
	"fmt"
	"ingester/artistutils"
	"ingester/common"
	"log"
	"log/slog"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"

	"ingester/crawler"
	"ingester/parser"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		sig := <-sigChan
		log.Printf("Received signal: %v, shutting down...\n", sig)
		cancel()
	}()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{AddSource: true}))
	slog.SetDefault(logger)

	err := godotenv.Load("../.env")
	if err != nil {
		if os.IsNotExist(err) {
			log.Println("No .env file found, proceeding with existing environment variables")
		} else {
			log.Println("Error loading .env file:", err)
		}
	}

	ingester := common.NewIngester(ctx)
	defer ingester.MongoClient.Disconnect(ctx)

	// Optionally wipe all state except for OAuthed users
	if os.Getenv("IS_DEV") == "true" && len(os.Args) > 2 && os.Args[2] == "--wipe" {
		if err := wipeBucket(ingester.S3Client, ingester.RawBucket); err != nil {
			logger.Error("Error creating raw bucket", "err", err)
		}
		if err := wipeBucket(ingester.S3Client, ingester.CrawledBucket); err != nil {
			logger.Error("Error creating raw bucket", "err", err)
		}

		filter := bson.M{}
		if result, err := ingester.CrawlerCursorColl.DeleteMany(ingester.Ctx, filter); err == nil {
			log.Printf("Deleted %d crawler_cursor documents\n", result.DeletedCount)
		} else {
			logger.Error("Error wiping crawler_cursor collection", "err", err)
		}
		if result, err := ingester.DeliveriesColl.DeleteMany(ingester.Ctx, filter); err == nil {
			log.Printf("Deleted %d deliveries\n", result.DeletedCount)
		} else {
			logger.Error("Error wiping deliveries collection", "err", err)
		}
		if result, err := ingester.PendingReleasesColl.DeleteMany(ingester.Ctx, filter); err == nil {
			log.Printf("Deleted %d pending_releases\n", result.DeletedCount)
		} else {
			logger.Error("Error wiping pending_releases collection", "err", err)
		}
		if result, err := ingester.PublishedReleasesColl.DeleteMany(ingester.Ctx, filter); err == nil {
			log.Printf("Deleted %d published_releases\n", result.DeletedCount)
		} else {
			logger.Error("Error wiping published_releases collection", "err", err)
		}
	}

	// Run migration to create artist name index
	if err := artistutils.CreateArtistNameIndex(ingester.UsersColl, ingester.Ctx); err != nil {
		log.Fatal(err)
	}

	// Start the crawler and parser
	go crawler.CrawlThenParse(ingester, parser.NewParser(ingester).ProcessDelivery)

	// Test the ingester with a delivery if provided
	if os.Getenv("IS_DEV") == "true" && len(os.Args) > 1 {
		if err := createBucket(ingester.S3Client, ingester.RawBucket); err != nil {
			logger.Error("Error creating raw bucket", "err", err)
		}
		if err := createBucket(ingester.S3Client, ingester.CrawledBucket); err != nil {
			logger.Error("Error creating raw bucket", "err", err)
		}
		fmt.Printf("Created buckets: %s, %s\n", ingester.RawBucket, ingester.CrawledBucket)

		testDeliveryPath := os.Args[1]
		testDeliveryURL := uploadTestDelivery(ingester, testDeliveryPath)
		logger.Info("Uploaded test delivery", "url", testDeliveryURL)
	}

	<-ctx.Done() // Wait until the context is canceled
	log.Println("Service stopped")
}

func createBucket(s3Client *s3.S3, bucket string) error {
	_, err := s3Client.CreateBucket(&s3.CreateBucketInput{
		Bucket: aws.String(bucket),
		CreateBucketConfiguration: &s3.CreateBucketConfiguration{
			LocationConstraint: aws.String(*s3Client.Config.Region),
		},
	})
	if err != nil {
		if aerr, ok := err.(awserr.Error); ok {
			switch aerr.Code() {
			case s3.ErrCodeBucketAlreadyExists:
				return fmt.Errorf("bucket name %s already in use", bucket)
			case s3.ErrCodeBucketAlreadyOwnedByYou:
				return fmt.Errorf("bucket exists %s and is owned by you", bucket)
			default:
				return fmt.Errorf("error creating bucket %s: %v", bucket, err)
			}
		}
	}

	return nil
}

func wipeBucket(s3Client *s3.S3, bucketName string) error {
	listParams := &s3.ListObjectsV2Input{
		Bucket: aws.String(bucketName),
	}

	err := s3Client.ListObjectsV2Pages(listParams, func(page *s3.ListObjectsV2Output, lastPage bool) bool {
		for _, object := range page.Contents {
			delParams := &s3.DeleteObjectInput{
				Bucket: aws.String(bucketName),
				Key:    object.Key,
			}
			_, err := s3Client.DeleteObject(delParams)
			if err != nil {
				slog.Default().Info("Failed to delete object %s from bucket %s, %v", *object.Key, bucketName, err)
				return false
			}
			slog.Default().Info("Deleted object %s from bucket %s", *object.Key, bucketName)
		}
		return true // continue paging
	})
	if err != nil {
		return fmt.Errorf("failed to list objects: %v", err)
	}
	slog.Default().Info("All objects deleted")
	return nil
}

func uploadTestDelivery(bi *common.Ingester, path string) string {
	info, err := os.Stat(path)
	if err != nil {
		log.Fatalf("Error getting file info for '%s': %v", path, err)
	}

	var s3Path string
	if info.IsDir() {
		baseDir := filepath.Base(path)
		s3Path, err = uploadDirectory(bi, path, baseDir)
	} else {
		// If it's a ZIP file, upload directly to the root of the S3 bucket
		if strings.HasSuffix(path, ".zip") {
			_, fileName := filepath.Split(path)
			s3Path, err = uploadFile(bi, path, "", fileName)
		}
	}
	if err != nil {
		log.Fatalf("Error uploading file or dir '%s': %v", path, err)
	}

	return fmt.Sprintf("s3://%s/%s", bi.RawBucket, s3Path)
}

func uploadDirectory(i *common.Ingester, dirPath, baseDir string) (string, error) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return "", fmt.Errorf("failed to read directory '%s': %w", dirPath, err)
	}

	for _, entry := range entries {
		if entry.Name() == ".DS_Store" {
			continue
		}

		fullPath := filepath.Join(dirPath, entry.Name())
		if entry.IsDir() {
			_, err = uploadDirectory(i, fullPath, filepath.Join(baseDir, entry.Name()))
		} else {
			_, err = uploadFile(i, fullPath, baseDir, entry.Name())
		}
		if err != nil {
			return "", err
		}
	}

	return baseDir, nil
}

func uploadFile(i *common.Ingester, filePath, baseDir, fileName string) (string, error) {
	if fileName == ".DS_Store" {
		return "", nil
	}

	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open file '%s': %w", filePath, err)
	}
	defer file.Close()

	s3Key := filepath.Join(baseDir, fileName)

	_, err = i.S3Uploader.Upload(&s3manager.UploadInput{
		Bucket: aws.String(i.RawBucket),
		Key:    aws.String(s3Key),
		Body:   file,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload '%s' to S3: %w", filePath, err)
	}

	return s3Key, nil
}
