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
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

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
