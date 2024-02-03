package parser

import (
	"context"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"ingester/constants"
	"log"
	"os"
	"time"
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
	log.Println("Parser: connected to mongo")
	defer client.Disconnect(context.Background())

	indexedColl := client.Database("ddex").Collection("indexed")
	pipeline := mongo.Pipeline{bson.D{{"$match", bson.D{{"operationType", "insert"}}}}}
	changeStream, err := indexedColl.Watch(context.Background(), pipeline)
	if err != nil {
		panic(err)
	}
	log.Println("Parser: watching collection 'indexed'")
	defer changeStream.Close(context.Background())

	for changeStream.Next(context.Background()) {
		var changeDoc bson.M
		if err := changeStream.Decode(&changeDoc); err != nil {
			log.Fatal(err)
		}
		fullDocument, _ := changeDoc["fullDocument"].(bson.M)
		parseIndexed(client, fullDocument)
	}

	if err := changeStream.Err(); err != nil {
		log.Fatal(err)
	}
}

func parseIndexed(client *mongo.Client, fullDocument bson.M) {
	log.Printf("Parser: Processing new indexed document: %v\n", fullDocument)
	indexedColl := client.Database("ddex").Collection("indexed")
	parsedColl := client.Database("ddex").Collection("parsed")

	// TODO process the delivery xml
	// 1. Validate all referenced audio/image files exist within the delivery

	session, err := client.StartSession()
	if err != nil {
		failAndUpdateStatus(err, indexedColl, context.Background(), fullDocument["_id"].(primitive.ObjectID))
	}
	err = mongo.WithSession(context.Background(), session, func(sessionContext mongo.SessionContext) error {
		if err := session.StartTransaction(); err != nil {
			return err
		}

		// 2. Write each release in "delivery_xml" in the indexed doc as a bson doc in the 'parsed' collection
		parsedDoc := bson.M{
			"delivery_id":  fullDocument["delivery_id"],
			"entity":       "track",
			"publish_date": time.Now(),
		}
		result, err := parsedColl.InsertOne(context.Background(), parsedDoc)
		if err != nil {
			session.AbortTransaction(sessionContext)
			return err
		}
		log.Println("Parser: New parsed release doc ID: ", result.InsertedID)

		// 3. Set delivery status for delivery in 'indexed' collection
		err = setDeliveryStatus(indexedColl, sessionContext, fullDocument["_id"].(primitive.ObjectID), constants.DeliveryStatusAwaitingPublishing)
		if err != nil {
			session.AbortTransaction(sessionContext)
			return err
		}

		return session.CommitTransaction(sessionContext)
	})

	if err != nil {
		failAndUpdateStatus(err, indexedColl, context.Background(), fullDocument["_id"].(primitive.ObjectID))
	}

	session.EndSession(context.Background())
}

func setDeliveryStatus(collection *mongo.Collection, context context.Context, documentId primitive.ObjectID, status string) error {
	update := bson.M{"$set": bson.M{"delivery_status": status}}
	_, err := collection.UpdateByID(context, documentId, update)
	return err
}

func failAndUpdateStatus(err error, collection *mongo.Collection, context context.Context, documentId primitive.ObjectID) {
	setDeliveryStatus(collection, context, documentId, constants.DeliveryStatusError)
	log.Fatal(err)
}
