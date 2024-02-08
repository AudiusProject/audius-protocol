package parser

import (
	"context"
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
	mongoClient         *mongo.Client
	rawBucket           string
	deliveriesColl      *mongo.Collection
	pendingReleasesColl *mongo.Collection
	ctx                 context.Context
	logger              *slog.Logger
}

func RunNewParser(ctx context.Context) {
	logger := slog.With("service", "parser")
	mongoClient := common.InitMongoClient(ctx, logger)
	defer mongoClient.Disconnect(ctx)

	p := &Parser{
		mongoClient:         mongoClient,
		rawBucket:           common.MustGetenv("AWS_BUCKET_RAW"),
		deliveriesColl:      mongoClient.Database("ddex").Collection("deliveries"),
		pendingReleasesColl: mongoClient.Database("ddex").Collection("pending_releases"),
		ctx:                 ctx,
		logger:              logger,
	}

	pipeline := mongo.Pipeline{bson.D{{Key: "$match", Value: bson.D{{Key: "operationType", Value: "insert"}}}}}
	changeStream, err := p.deliveriesColl.Watch(ctx, pipeline)
	if err != nil {
		panic(err)
	}
	p.logger.Info("Watching collection 'deliveries'")
	defer changeStream.Close(ctx)

	for changeStream.Next(ctx) {
		p.processDelivery(changeStream)
	}

	if err := changeStream.Err(); err != nil {
		log.Fatal(err)
	}
}

func (p *Parser) processDelivery(changeStream *mongo.ChangeStream) {
	// Decode the "delivery" from Mongo
	var changeDoc struct {
		FullDocument common.Delivery `bson:"fullDocument"`
	}
	if err := changeStream.Decode(&changeDoc); err != nil {
		log.Fatal(err)
	}
	delivery := changeDoc.FullDocument
	p.logger.Info("Processing new delivery", "_id", delivery.ID)

	// TODO process the delivery xml
	// 1. Validate all referenced audio/image files exist within the delivery

	session, err := p.mongoClient.StartSession()
	if err != nil {
		p.failAndUpdateStatus(err, delivery.ID)
	}
	err = mongo.WithSession(p.ctx, session, func(sessionContext mongo.SessionContext) error {
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
		result, err := p.pendingReleasesColl.InsertOne(p.ctx, pendingRelease)
		if err != nil {
			session.AbortTransaction(sessionContext)
			return err
		}
		p.logger.Info("New pending release", "_id", result.InsertedID)

		// 3. Set delivery status for delivery in 'deliveries' collection
		err = p.setDeliveryStatus(sessionContext, delivery.ID, constants.DeliveryStatusAwaitingPublishing)
		if err != nil {
			session.AbortTransaction(sessionContext)
			return err
		}

		return session.CommitTransaction(sessionContext)
	})

	if err != nil {
		p.failAndUpdateStatus(err, delivery.ID)
	}

	session.EndSession(p.ctx)
}

func (p *Parser) setDeliveryStatus(ctx context.Context, documentId primitive.ObjectID, status string) error {
	update := bson.M{"$set": bson.M{"delivery_status": status}}
	_, err := p.deliveriesColl.UpdateByID(ctx, documentId, update)
	return err
}

func (p *Parser) failAndUpdateStatus(err error, documentId primitive.ObjectID) {
	p.setDeliveryStatus(p.ctx, documentId, constants.DeliveryStatusError)
	log.Fatal(err)
}
