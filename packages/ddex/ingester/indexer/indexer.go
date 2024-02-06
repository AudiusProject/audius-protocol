package indexer

import (
	"context"
	"ingester/common"
	"ingester/constants"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func Run(ctx context.Context) {
	mongoClient := common.InitMongoClient(ctx)
	defer mongoClient.Disconnect(ctx)

	uploadsColl := mongoClient.Database("ddex").Collection("uploads")
	pipeline := mongo.Pipeline{bson.D{{"$match", bson.D{{"operationType", "insert"}}}}}
	changeStream, err := uploadsColl.Watch(ctx, pipeline)
	if err != nil {
		panic(err)
	}
	log.Println("Watching collection 'uploads'")
	defer changeStream.Close(ctx)

	for changeStream.Next(ctx) {
		var changeDoc bson.M
		if err := changeStream.Decode(&changeDoc); err != nil {
			log.Fatal(err)
		}
		fullDocument, _ := changeDoc["fullDocument"].(bson.M)
		indexUpload(mongoClient, fullDocument, ctx)
	}

	if err := changeStream.Err(); err != nil {
		log.Fatal(err)
	}
}

func indexUpload(client *mongo.Client, fullDocument bson.M, ctx context.Context) {
	log.Printf("Processing new upload: %v\n", fullDocument)
	indexedColl := client.Database("ddex").Collection("indexed")

	delete(fullDocument, "_id")

	// TODO process upload:
	// 1. download zip from raw s3 bucket
	// 2. unzip
	// 3. upload files to indexed s3 bucket

	// Write delivery to 'indexed' collection
	fullDocument["delivery_status"] = constants.DeliveryStatusValidating
	// TODO download xml from bucket
	// fullDocument["delivery_xml"] = ...

	result, err := indexedColl.InsertOne(ctx, fullDocument)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("New indexed doc ID: ", result.InsertedID)
}
