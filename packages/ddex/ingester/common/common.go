package common

import (
	"context"
	"log"
	"log/slog"
	"os"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Cursor struct {
	CollectionName string    `bson:"collection_name"`
	ResumeToken    bson.Raw  `bson:"resume_token"`
	LastUpdated    time.Time `bson:"last_updated"`
}

type Ingester interface {
	GetResumeToken(ctx context.Context, collectionName string) (bson.Raw, error)
	UpdateResumeToken(ctx context.Context, collectionName string, resumeToken bson.Raw) error
}

type BaseIngester struct {
	Ctx                 context.Context
	MongoClient         *mongo.Client
	S3Client            *s3.S3
	S3Downloader        *s3manager.Downloader
	S3Uploader          *s3manager.Uploader
	RawBucket           string
	IndexedBucket       string
	CursorsColl         *mongo.Collection
	UploadsColl         *mongo.Collection
	DeliveriesColl      *mongo.Collection
	PendingReleasesColl *mongo.Collection
	UsersColl           *mongo.Collection
	Logger              *slog.Logger
}

func NewBaseIngester(ctx context.Context, service string) *BaseIngester {
	logger := slog.With("service", service)
	s3, s3Session := InitS3Client(logger)
	mongoClient := InitMongoClient(ctx, logger)

	return &BaseIngester{
		S3Client:            s3,
		S3Downloader:        s3manager.NewDownloader(s3Session),
		S3Uploader:          s3manager.NewUploader(s3Session),
		MongoClient:         mongoClient,
		RawBucket:           MustGetenv("AWS_BUCKET_RAW"),
		IndexedBucket:       MustGetenv("AWS_BUCKET_INDEXED"),
		CursorsColl:         mongoClient.Database("ddex").Collection("cursors"),
		UploadsColl:         mongoClient.Database("ddex").Collection("uploads"),
		DeliveriesColl:      mongoClient.Database("ddex").Collection("deliveries"),
		PendingReleasesColl: mongoClient.Database("ddex").Collection("pending_releases"),
		UsersColl:           mongoClient.Database("ddex").Collection("users"),
		Ctx:                 ctx,
		Logger:              logger,
	}
}

// ProcessChangeStream watches a collection for new insert operations and processes them with the provided function.
func (bi *BaseIngester) ProcessChangeStream(c *mongo.Collection, exec func(*mongo.ChangeStream)) {
	p := mongo.Pipeline{bson.D{{Key: "$match", Value: bson.D{{Key: "operationType", Value: "insert"}}}}}
	rt, _ := bi.GetResumeToken(c.Name())
	var opts *options.ChangeStreamOptions
	if rt == nil {
		// Start at the beginning (oldest timestamp in oplog because the time has to be in the oplog for the resume token to work)
		oldestOplogTimestamp, err := getOldestOplogTimestamp(bi.MongoClient)
		if err != nil {
			log.Fatal(err)
		}
		bi.Logger.Info("Starting at oldest oplog timestamp", "timestamp", oldestOplogTimestamp)
		opts = options.ChangeStream().SetStartAtOperationTime(&oldestOplogTimestamp)
	} else {
		// Note: if the collection is dropped and recreated, inserts will still be replayed from this resume token
		bi.Logger.Info("Resuming from resume token", "resume_token", rt)
		opts = options.ChangeStream().SetStartAfter(rt)
	}

	cs, err := c.Watch(bi.Ctx, p, opts)
	if err != nil {
		panic(err)
	}
	bi.Logger.Info("Watching collection", "collection", c.Name())
	defer cs.Close(bi.Ctx)

	for cs.Next(bi.Ctx) {
		exec(cs)
		rt := cs.ResumeToken()
		if err := bi.UpdateResumeToken(c.Name(), rt); err != nil {
			log.Fatalf("Failed to update resume token for '%s': %v", c.Name(), err)
		}
	}

	if err := cs.Err(); err != nil {
		log.Fatal(err)
	}
}

func (bi *BaseIngester) GetResumeToken(collectionName string) (bson.Raw, error) {
	var cursorDoc Cursor
	if err := bi.CursorsColl.FindOne(bi.Ctx, bson.M{"collection_name": collectionName}).Decode(&cursorDoc); err != nil {
		return nil, err
	}
	return cursorDoc.ResumeToken, nil
}

func (bi *BaseIngester) UpdateResumeToken(collectionName string, resumeToken bson.Raw) error {
	filter := bson.M{"collection_name": collectionName}
	update := bson.M{"$set": Cursor{CollectionName: collectionName, ResumeToken: resumeToken, LastUpdated: time.Now()}}
	_, err := bi.CursorsColl.UpdateOne(bi.Ctx, filter, update, options.Update().SetUpsert(true))
	return err
}

func InitMongoClient(ctx context.Context, logger *slog.Logger) *mongo.Client {
	mongoUrl := os.Getenv("DDEX_MONGODB_URL")
	if mongoUrl == "" {
		mongoUrl = "mongodb://mongo:mongo@localhost:27017/ddex?authSource=admin&replicaSet=rs0"
	}
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoUrl))
	if err != nil {
		panic(err)
	}
	logger.Info("Connected to mongo")
	return client
}

func InitS3Client(logger *slog.Logger) (*s3.S3, *session.Session) {
	awsRegion := MustGetenv("AWS_REGION")
	awsKey := MustGetenv("AWS_ACCESS_KEY_ID")
	awsSecret := MustGetenv("AWS_SECRET_ACCESS_KEY")
	sess, err := session.NewSession(&aws.Config{
		Region:      aws.String(awsRegion),
		Credentials: credentials.NewStaticCredentials(awsKey, awsSecret, ""),
	})
	if err != nil {
		panic(err)
	}
	logger.Info("Connected to s3")
	return s3.New(sess), sess
}

func MustGetenv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Println("Missing required env variable: ", key, " sleeping ...")
		// If config is incorrect, sleep a bit to prevent container from restarting constantly
		time.Sleep(time.Hour)
		log.Fatal("Missing required env variable: ", key)
	}
	return val
}

func getOldestOplogTimestamp(client *mongo.Client) (primitive.Timestamp, error) {
	var result struct {
		TS primitive.Timestamp `bson:"ts"`
	}

	oplogCollection := client.Database("local").Collection("oplog.rs")
	opts := options.FindOne().SetSort(bson.D{{Key: "ts", Value: 1}})
	err := oplogCollection.FindOne(context.TODO(), bson.D{}, opts).Decode(&result)
	if err != nil {
		return primitive.Timestamp{}, err
	}

	return result.TS, nil
}
