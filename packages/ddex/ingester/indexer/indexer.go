package indexer

import (
	"context"
	"fmt"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"os"
)

func Run() {
	mongoUrl := os.Getenv("DDEX_MONGODB_URL")
	if mongoUrl == "" {
		mongoUrl = "mongodb://mongo:mongo@localhost:27017/ddex?authSource=admin"
	}
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(mongoUrl))
	if err != nil {
		panic(err)
	}
	defer client.Disconnect(context.Background())

	coll := client.Database("ddex").Collection("uploads")
	changeStream, err := coll.Watch(context.Background(), mongo.Pipeline{})
	if err != nil {
		panic(err)
	}
	defer changeStream.Close(context.Background())

	for changeStream.Next(context.Background()) {
		fmt.Printf("Indexer: received change event: %v\n", changeStream.Current)
		// TODO process the event
	}
}
