package main

import (
	"context"
	"fmt"
	"ingester/artistutils"
	"ingester/common"
	"ingester/constants"
	"log"
	"log/slog"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"ingester/crawler"
	"ingester/parser"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/service/s3"
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
		if ingester.S3Client.Endpoint != "http://ingress:4566" && ingester.S3Client.Endpoint != "http://localhost:4566" {
			logger.Error("ignoring the --wipe flag because the AWS bucket is not localstack")
			return
		}

		if err := wipeBucket(ingester.S3Client, ingester.Bucket); err != nil {
			logger.Error("Error wiping bucket", "err", err)
		}

		filter := bson.M{}
		if result, err := ingester.CrawlerCursorColl.DeleteMany(ingester.Ctx, filter); err == nil {
			log.Printf("Deleted %d crawler_cursor documents\n", result.DeletedCount)
		} else {
			logger.Error("Error wiping crawler_cursor collection", "err", err)
		}
		if result, err := ingester.BatchesColl.DeleteMany(ingester.Ctx, filter); err == nil {
			log.Printf("Deleted %d batches documents\n", result.DeletedCount)
		} else {
			logger.Error("Error wiping batches collection", "err", err)
		}
		if result, err := ingester.ReleasesColl.DeleteMany(ingester.Ctx, filter); err == nil {
			log.Printf("Deleted %d releases documents\n", result.DeletedCount)
		} else {
			logger.Error("Error wiping releases collection", "err", err)
		}
	}

	// Run migration to create artist name index
	if err := artistutils.CreateArtistNameIndex(ingester.UsersColl, ingester.Ctx); err != nil {
		log.Fatal(err)
	}

	// Crawl and parse each new delivery that gets put into S3
	p := parser.NewParser(ingester)
	go crawler.CrawlThenParse(ingester)

	// Re-parse releases (UI sets release_status to "awaiting_parse" to re-parse)
	go func() {
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				cursor, err := ingester.ReleasesColl.Find(ingester.Ctx, bson.M{"release_status": constants.ReleaseStatusAwaitingParse})
				if err != nil {
					logger.Error("Error querying releases", "err", err)
					continue
				}

				for cursor.Next(ingester.Ctx) {
					var release common.Release
					err := cursor.Decode(&release)
					if err != nil {
						logger.Error("Error unmarshalling release", "err", err)
						continue
					}

					logger.Info("(Re-)parsing release", "release_id", release.ReleaseID)
					if ok := p.ParseRelease(&release); !ok {
						logger.Error("Failed to parse release in an unexpected way (couldn't update status)", "release_id", release.ReleaseID)
					}
				}

				// Close the cursor and check for errors
				if err := cursor.Close(ctx); err != nil {
					logger.Error("Error closing cursor", "err", err)
				}
				if err := cursor.Err(); err != nil {
					logger.Error("Error during cursor iteration", "err", err)
				}
			}
		}
	}()

	// Test the ingester with a delivery if provided
	if os.Getenv("IS_DEV") == "true" {
		if err := createBucket(ingester.S3Client, ingester.Bucket); err != nil {
			logger.Error("Error creating raw bucket", "err", err)
		}
		fmt.Printf("Created bucket: %s\n", ingester.Bucket)

		if len(os.Args) > 1 {
			testDeliveryPath := os.Args[1]
			testDeliveryURL := uploadTestDelivery(ingester, testDeliveryPath)
			logger.Info("Uploaded test delivery", "local path", testDeliveryPath, "url", testDeliveryURL)
		}
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
	if s3Client.Endpoint != "http://ingress:4566" && s3Client.Endpoint != "http://localhost:4566" {
		return fmt.Errorf("cannot wipe bucket '%s' because endpoint is not localstack", bucketName)
	}

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

func uploadTestDelivery(i *common.Ingester, path string) string {
	info, err := os.Stat(path)
	if err != nil {
		log.Fatalf("Error getting file info for '%s': %v", path, err)
	}

	var s3Path string
	if info.IsDir() {
		baseDir := filepath.Base(path)
		s3Path, err = i.UploadDirectory(path, baseDir)
	} else {
		// If it's a ZIP file, upload directly to the root of the S3 bucket
		if strings.HasSuffix(path, ".zip") {
			_, fileName := filepath.Split(path)
			s3Path, err = i.UploadFile(path, "", fileName)
		}
	}
	if err != nil {
		log.Fatalf("Error uploading file or dir '%s': %v", path, err)
	}

	return fmt.Sprintf("s3://%s/%s", i.Bucket, s3Path)
}
