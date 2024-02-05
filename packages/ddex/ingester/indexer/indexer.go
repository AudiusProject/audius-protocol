package indexer

import (
	"context"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"ingester/constants"
	"log"
	"os"
)

func Run() {
	mongoUrl := os.Getenv("DDEX_MONGODB_URL")
	if mongoUrl == "" {
		mongoUrl = "mongodb://mongo:mongo@localhost:27017/ddex?authSource=admin&replicaSet=rs0"
	}
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(mongoUrl))
	if err != nil {
		panic(err)
	}
	log.Println("Indexer: connected to mongo")
	defer client.Disconnect(context.Background())

	uploadsColl := client.Database("ddex").Collection("uploads")
	changeStream, err := uploadsColl.Watch(context.Background(), mongo.Pipeline{})
	if err != nil {
		panic(err)
	}
	log.Println("Indexer: watching collection 'uploads'")
	defer changeStream.Close(context.Background())

	for changeStream.Next(context.Background()) {
		var changeDoc bson.M
		if err := changeStream.Decode(&changeDoc); err != nil {
			log.Fatal(err)
		}
		fullDocument, _ := changeDoc["fullDocument"].(bson.M)
		indexUpload(client, fullDocument)
	}

	if err := changeStream.Err(); err != nil {
		log.Fatal(err)
	}
}

func indexUpload(client *mongo.Client, fullDocument bson.M) {
	log.Printf("Indexed: Processing new upload: %v\n", fullDocument)
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

	result, err := indexedColl.InsertOne(context.Background(), fullDocument)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Indexer: New indexed doc ID: ", result.InsertedID)
}
