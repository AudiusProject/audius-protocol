package parser

import (
	"context"
	"fmt"
	"ingester/common"
	"ingester/constants"
	"log"
	"log/slog"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type Parser struct {
	mongoClient *mongo.Client
	indexedColl *mongo.Collection
	parsedColl  *mongo.Collection
	ctx         context.Context
	logger      *slog.Logger
}

// RunNewParser starts the parser service, which listens for new indexed documents in the Mongo "indexed" collection and turns them into Audius format track format.
func RunNewParser(ctx context.Context) {
	mongoClient := common.InitMongoClient(ctx)
	defer mongoClient.Disconnect(ctx)
	indexedColl := mongoClient.Database("ddex").Collection("indexed")
	parsedColl := mongoClient.Database("ddex").Collection("parsed")

	p := &Parser{
		mongoClient: mongoClient,
		indexedColl: indexedColl,
		parsedColl:  parsedColl,
		ctx:         ctx,
		logger:      slog.With("service", "parser"),
	}

	pipeline := mongo.Pipeline{bson.D{{Key: "$match", Value: bson.D{{Key: "operationType", Value: "insert"}}}}}
	changeStream, err := indexedColl.Watch(ctx, pipeline)
	if err != nil {
		panic(err)
	}
	p.logger.Info("Watching collection 'indexed'")
	defer changeStream.Close(ctx)

	for changeStream.Next(ctx) {
		var changeDoc bson.M
		if err := changeStream.Decode(&changeDoc); err != nil {
			log.Fatal(err)
		}
		fullDocument, _ := changeDoc["fullDocument"].(bson.M)
		p.parseIndexed(fullDocument)
	}

	if err := changeStream.Err(); err != nil {
		log.Fatal(err)
	}
}

func (p *Parser) parseIndexed(fullDocument bson.M) {
	p.logger.Info("Processing new indexed document", "document", fullDocument)
	xmlData := fullDocument["xml_content"].(primitive.Binary).Data
	createTrackRelease, createAlbumRelease, errs := parseSonyXML(xmlData)
	if len(errs) != 0 {
		p.logger.Error("Failed to parse delivery. Printing errors...")
		for _, err := range errs {
			p.logger.Error(err.Error())
		}
		p.failAndUpdateStatus(fullDocument["_id"].(primitive.ObjectID), fmt.Errorf("failed to parse delivery: %v", errs))
	}
	p.logger.Info("Parsed delivery", "createTrackRelease", fmt.Sprintf("%+v", createTrackRelease), "createAlbumRelease", fmt.Sprintf("%+v", createAlbumRelease))

	// TODO: We can loop through each release and validate if its URLs exist in the delivery.
	//       However, the DDEX spec actually says that a delivery can leave out the assets and just have the metadata (assuming they'll do another delivery with the assets closer to release date).

	session, err := p.mongoClient.StartSession()
	if err != nil {
		p.failAndUpdateStatus(fullDocument["_id"].(primitive.ObjectID), err)
	}
	err = mongo.WithSession(p.ctx, session, func(sessionCtx mongo.SessionContext) error {
		if err := session.StartTransaction(); err != nil {
			return err
		}

		// 2. Write each release in "delivery_xml" in the indexed doc as a bson doc in the 'parsed' collection
		parsedDoc := bson.M{
			"upload_etag":  fullDocument["upload_etag"],
			"delivery_id":  fullDocument["delivery_id"],
			"entity":       "track",
			"publish_date": time.Now(),
		}
		result, err := p.parsedColl.InsertOne(p.ctx, parsedDoc)
		if err != nil {
			session.AbortTransaction(sessionCtx)
			return err
		}
		p.logger.Info("New parsed release doc", "id", result.InsertedID)

		// 3. Set delivery status for delivery in 'indexed' collection
		err = p.setIndexedDeliveryStatus(fullDocument["_id"].(primitive.ObjectID), constants.DeliveryStatusAwaitingPublishing, sessionCtx)
		if err != nil {
			session.AbortTransaction(sessionCtx)
			return err
		}

		return session.CommitTransaction(sessionCtx)
	})

	if err != nil {
		p.failAndUpdateStatus(fullDocument["_id"].(primitive.ObjectID), err)
	}

	session.EndSession(p.ctx)
}

func (p *Parser) setIndexedDeliveryStatus(documentId primitive.ObjectID, status string, ctx context.Context) error {
	update := bson.M{"$set": bson.M{"delivery_status": status}}
	_, err := p.indexedColl.UpdateByID(ctx, documentId, update)
	return err
}

func (p *Parser) failAndUpdateStatus(documentId primitive.ObjectID, err error) {
	p.setIndexedDeliveryStatus(documentId, constants.DeliveryStatusError, p.ctx)
	log.Fatal(err)
}
