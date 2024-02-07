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
	pipeline := mongo.Pipeline{bson.D{{Key: "$match", Value: bson.D{{Key: "operationType", Value: "insert"}}}}}
	changeStream, err := indexedColl.Watch(ctx, pipeline)
	if err != nil {
		panic(err)
	}
	log.Println("Watching collection 'indexed'")
	defer changeStream.Close(ctx)

	for changeStream.Next(ctx) {
		var changeDoc struct {
			FullDocument common.Indexed `bson:"fullDocument"`
		}
		if err := changeStream.Decode(&changeDoc); err != nil {
			log.Fatal(err)
		}
		parseIndexed(mongoClient, changeDoc.FullDocument, ctx)
	}

	if err := changeStream.Err(); err != nil {
		log.Fatal(err)
	}
}

func parseIndexed(client *mongo.Client, indexed common.Indexed, ctx context.Context) {
	log.Printf("Processing new indexed document: %v\n", indexed)
	indexedColl := client.Database("ddex").Collection("indexed")
	parsedColl := client.Database("ddex").Collection("parsed")

	// TODO process the delivery xml
	// 1. Validate all referenced audio/image files exist within the delivery

	session, err := client.StartSession()
	if err != nil {
		failAndUpdateStatus(err, indexedColl, ctx, indexed.ID)
	}
	err = mongo.WithSession(ctx, session, func(sessionContext mongo.SessionContext) error {
		if err := session.StartTransaction(); err != nil {
			return err
		}

		// 2. Write each release in "delivery_xml" in the indexed doc as a bson doc in the 'parsed' collection
		parsedDoc := bson.M{
			"upload_etag":  indexed.UploadETag,
			"delivery_id":  indexed.DeliveryID,
			"entity":       "track",
			"publish_date": time.Now(),
			"created_at":   time.Now(),
		}
		result, err := parsedColl.InsertOne(ctx, parsedDoc)
		if err != nil {
			session.AbortTransaction(sessionContext)
			return err
		}
		log.Println("New parsed release doc ID: ", result.InsertedID)

		// 3. Set delivery status for delivery in 'indexed' collection
		err = setDeliveryStatus(indexedColl, sessionContext, indexed.ID, constants.DeliveryStatusAwaitingPublishing)
		if err != nil {
			session.AbortTransaction(sessionContext)
			return err
		}

		return session.CommitTransaction(sessionContext)
	})

	if err != nil {
		failAndUpdateStatus(err, indexedColl, ctx, indexed.ID)
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
