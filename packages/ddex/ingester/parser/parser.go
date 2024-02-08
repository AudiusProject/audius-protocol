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

	deliveriesColl := mongoClient.Database("ddex").Collection("deliveries")
	pipeline := mongo.Pipeline{bson.D{{Key: "$match", Value: bson.D{{Key: "operationType", Value: "insert"}}}}}
	changeStream, err := deliveriesColl.Watch(ctx, pipeline)
	if err != nil {
		panic(err)
	}
	log.Println("Watching collection 'deliveries'")
	defer changeStream.Close(ctx)

	for changeStream.Next(ctx) {
		var changeDoc struct {
			FullDocument common.Delivery `bson:"fullDocument"`
		}
		if err := changeStream.Decode(&changeDoc); err != nil {
			log.Fatal(err)
		}
		parseDelivery(mongoClient, changeDoc.FullDocument, ctx)
	}

	if err := changeStream.Err(); err != nil {
		log.Fatal(err)
	}
}

func parseDelivery(client *mongo.Client, delivery common.Delivery, ctx context.Context) {
	log.Printf("Processing new delivery: %v\n", delivery)
	deliveriesColl := client.Database("ddex").Collection("deliveries")
	pendingReleasesColl := client.Database("ddex").Collection("pending_releases")

	// TODO process the delivery xml
	// 1. Validate all referenced audio/image files exist within the delivery

	session, err := client.StartSession()
	if err != nil {
		failAndUpdateStatus(err, deliveriesColl, ctx, delivery.ID)
	}
	err = mongo.WithSession(ctx, session, func(sessionContext mongo.SessionContext) error {
		if err := session.StartTransaction(); err != nil {
			return err
		}

		// 2. Write each release in "delivery_xml" in the delivery as a bson doc in the 'pending_releases' collection
		pendingRelease := bson.M{
			"upload_etag":  delivery.UploadETag,
			"delivery_id":  delivery.ID,
			"entity":       "track",
			"publish_date": time.Now(),
			"created_at":   time.Now(),
		}
		result, err := pendingReleasesColl.InsertOne(ctx, pendingRelease)
		if err != nil {
			session.AbortTransaction(sessionContext)
			return err
		}
		log.Println("New pending release: ", result.InsertedID)

		// 3. Set delivery status for delivery in 'deliveries' collection
		err = setDeliveryStatus(deliveriesColl, sessionContext, delivery.ID, constants.DeliveryStatusAwaitingPublishing)
		if err != nil {
			session.AbortTransaction(sessionContext)
			return err
		}

		return session.CommitTransaction(sessionContext)
	})

	if err != nil {
		failAndUpdateStatus(err, deliveriesColl, ctx, delivery.ID)
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
