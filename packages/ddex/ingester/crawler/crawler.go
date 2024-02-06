package crawler

import (
	"context"
	"ingester/common"
	"log"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func Run(ctx context.Context) {
	s3Client := common.InitS3Client()
	mongoClient := common.InitMongoClient(ctx)
	defer mongoClient.Disconnect(ctx)

	bucketName := common.MustGetenv("AWS_BUCKET_RAW")
	ticker := time.NewTicker(3 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			lastPolledTime, err := getLastPolledTime(mongoClient, ctx)
			if err != nil {
				log.Println("Failed to retrieve s3 raw bucket's last polled time:", err)
				continue
			}

			uploads, err := pollS3Bucket(s3Client, bucketName, lastPolledTime)
			if err != nil {
				log.Println("Error polling S3 bucket:", err)
				continue
			}

			if len(uploads) > 0 {
				err = persistUploads(mongoClient, bucketName, uploads, ctx)
				if err != nil {
					log.Println("Error inserting into mongodb:", err)
					continue
				}
				log.Printf("Processed %d new uploads", len(uploads))
			}

			err = updateLastPolledTime(mongoClient, time.Now(), ctx)
			if err != nil {
				log.Println("Failed to update s3 raw bucket's last polled time:", err)
			}

			if ctx.Err() != nil {
				return
			}
		}
	}
}

func updateLastPolledTime(client *mongo.Client, lastPolledTime time.Time, ctx context.Context) error {
	collection := client.Database("ddex").Collection("cursors")

	filter := bson.M{"service": "crawler"}
	update := bson.M{"$set": bson.M{"s3RawLastPolledTime": lastPolledTime}}
	opts := options.Update().SetUpsert(true)

	_, err := collection.UpdateOne(ctx, filter, update, opts)
	return err
}

func getLastPolledTime(client *mongo.Client, ctx context.Context) (time.Time, error) {
	collection := client.Database("ddex").Collection("cursors")

	var result struct {
		LastPolledTime time.Time `bson:"s3RawLastPolledTime"`
	}
	filter := bson.M{"service": "crawler"}

	err := collection.FindOne(ctx, filter).Decode(&result)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// No record found, return zero time
			return time.Time{}, nil
		}
		return time.Time{}, err
	}

	return result.LastPolledTime, nil
}

func pollS3Bucket(s3Client *s3.S3, bucketName string, lastPolledTime time.Time) ([]*s3.Object, error) {
	resp, err := s3Client.ListObjectsV2(&s3.ListObjectsV2Input{
		Bucket: aws.String(bucketName),
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

func persistUploads(client *mongo.Client, bucket string, uploads []*s3.Object, ctx context.Context) error {
	uploadsColl := client.Database("ddex").Collection("uploads")
	for _, upload := range uploads {
		path := "s3://" + bucket + "/" + *upload.Key
		etag := strings.Trim(*upload.ETag, "\"")
		// Only insert if a document doesn't already exist with this path and etag
		filter := bson.M{"path": path, "delivery_etag": etag}
		update := bson.M{"$setOnInsert": bson.M{"path": path, "delivery_etag": etag}}
		opts := options.Update().SetUpsert(true)
		_, err := uploadsColl.UpdateOne(ctx, filter, update, opts)
		if err != nil {
			return err
		}
	}
	return nil
}
