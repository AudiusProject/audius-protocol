package parser

import (
	"context"
	"ingester/common"
	"ingester/constants"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func Run(ctx context.Context) {
	mongoClient := common.InitMongoClient(ctx)
	defer mongoClient.Disconnect(ctx)

	indexedColl := mongoClient.Database("ddex").Collection("indexed")
	pipeline := mongo.Pipeline{bson.D{{"$match", bson.D{{"operationType", "insert"}}}}}
	changeStream, err := indexedColl.Watch(ctx, pipeline)
	if err != nil {
		panic(err)
	}
	log.Println("Watching collection 'indexed'")
	defer changeStream.Close(ctx)

	for changeStream.Next(ctx) {
		var changeDoc bson.M
		if err := changeStream.Decode(&changeDoc); err != nil {
			log.Fatal(err)
		}
		fullDocument, _ := changeDoc["fullDocument"].(bson.M)
		parseIndexed(mongoClient, fullDocument, ctx)
	}

	if err := changeStream.Err(); err != nil {
		log.Fatal(err)
	}
}

func parseIndexed(client *mongo.Client, fullDocument bson.M, ctx context.Context) {
	log.Printf("Processing new indexed document: %v\n", fullDocument)
	indexedColl := client.Database("ddex").Collection("indexed")
	parsedColl := client.Database("ddex").Collection("parsed")

	// TODO process the delivery xml
	// 1. Validate all referenced audio/image files exist within the delivery

	session, err := client.StartSession()
	if err != nil {
		failAndUpdateStatus(err, indexedColl, ctx, fullDocument["_id"].(primitive.ObjectID))
	}
	err = mongo.WithSession(ctx, session, func(sessionContext mongo.SessionContext) error {
		if err := session.StartTransaction(); err != nil {
			return err
		}

		// 2. Write each release in "delivery_xml" in the indexed doc as a bson doc in the 'parsed' collection
		parsedDoc := bson.M{
			"delivery_etag": fullDocument["delivery_etag"],
			"entity":        "track",
			"publish_date":  time.Now(),
		}
		result, err := parsedColl.InsertOne(ctx, parsedDoc)
		if err != nil {
			session.AbortTransaction(sessionContext)
			return err
		}
		log.Println("New parsed release doc ID: ", result.InsertedID)

		// 3. Set delivery status for delivery in 'indexed' collection
		err = setDeliveryStatus(indexedColl, sessionContext, fullDocument["_id"].(primitive.ObjectID), constants.DeliveryStatusAwaitingPublishing)
		if err != nil {
			session.AbortTransaction(sessionContext)
			return err
		}

		return session.CommitTransaction(sessionContext)
	})

	if err != nil {
		failAndUpdateStatus(err, indexedColl, ctx, fullDocument["_id"].(primitive.ObjectID))
	}

	session.EndSession(ctx)
}

func setDeliveryStatus(collection *mongo.Collection, ctx context.Context, documentId primitive.ObjectID, status string) error {
	update := bson.M{"$set": bson.M{"delivery_status": status}}
	_, err := collection.UpdateByID(ctx, documentId, update)
	return err
}

func failAndUpdateStatus(err error, collection *mongo.Collection, ctx context.Context, documentId primitive.ObjectID) {
	setDeliveryStatus(collection, ctx, documentId, constants.DeliveryStatusError)
	log.Fatal(err)
}
