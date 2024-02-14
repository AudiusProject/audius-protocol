package parser

import (
	"context"
	"fmt"
	"ingester/common"
	"ingester/constants"
	"log"
	"log/slog"
	"time"

	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type Parser struct {
	s3Downloader        *s3manager.Downloader
	mongoClient         *mongo.Client
	rawBucket           string
	indexedBucket       string
	deliveriesColl      *mongo.Collection
	pendingReleasesColl *mongo.Collection
	ctx                 context.Context
	logger              *slog.Logger
}

// RunNewParser starts the parser service, which listens for new delivery documents in the Mongo "deliveries" collection and turns them into Audius format track format.
func RunNewParser(ctx context.Context) {
	logger := slog.With("service", "parser")
	_, s3Session := common.InitS3Client(logger)
	mongoClient := common.InitMongoClient(ctx, logger)
	defer mongoClient.Disconnect(ctx)

	p := &Parser{
		s3Downloader:        s3manager.NewDownloader(s3Session),
		mongoClient:         mongoClient,
		rawBucket:           common.MustGetenv("AWS_BUCKET_RAW"),
		indexedBucket:       common.MustGetenv("AWS_BUCKET_INDEXED"),
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

	xmlData := delivery.XmlContent.Data
	createTrackRelease, createAlbumRelease, errs := parseSonyXML(xmlData, p.indexedBucket, delivery.ID.Hex())
	if len(errs) != 0 {
		p.logger.Error("Failed to parse delivery. Printing errors...")
		for _, err := range errs {
			p.logger.Error(err.Error())
		}
		p.failAndUpdateStatus(delivery.ID, fmt.Errorf("failed to parse delivery: %v", errs))
	}
	p.logger.Info("Parsed delivery", "createTrackRelease", fmt.Sprintf("%+v", createTrackRelease), "createAlbumRelease", fmt.Sprintf("%+v", createAlbumRelease))

	// TODO: We can loop through each release and validate if its URLs exist in the delivery.
	//       However, the DDEX spec actually says that a delivery can leave out the assets and just have the metadata (assuming they'll do another delivery with the assets closer to release date).

	session, err := p.mongoClient.StartSession()
	if err != nil {
		p.failAndUpdateStatus(delivery.ID, err)
	}
	err = mongo.WithSession(p.ctx, session, func(sessionCtx mongo.SessionContext) error {
		if err := session.StartTransaction(); err != nil {
			return err
		}

		// 2. Write each release in "delivery_xml" in the delivery as a bson doc in the 'pending_releases' collection
		for _, track := range createTrackRelease {
			pendingRelease := bson.M{
				"upload_etag":          delivery.UploadETag,
				"delivery_id":          delivery.ID,
				"create_track_release": track,
				"publish_date":         track.Metadata.ReleaseDate, // TODO: Use time instead of string so it can be queried properly
				"created_at":           time.Now(),
			}
			result, err := p.pendingReleasesColl.InsertOne(p.ctx, pendingRelease)
			if err != nil {
				session.AbortTransaction(sessionCtx)
				return err
			}
			p.logger.Info("Inserted pending track release", "_id", result.InsertedID)
		}
		for _, album := range createAlbumRelease {
			pendingRelease := bson.M{
				"upload_etag":          delivery.UploadETag,
				"delivery_id":          delivery.ID,
				"create_album_release": album,
				"publish_date":         album.Metadata.ReleaseDate, // TODO: Use time instead of string so it can be queried properly
				"created_at":           time.Now(),
			}
			result, err := p.pendingReleasesColl.InsertOne(p.ctx, pendingRelease)
			if err != nil {
				session.AbortTransaction(sessionCtx)
				return err
			}
			p.logger.Info("Inserted pending album release", "_id", result.InsertedID)
		}

		// 3. Set delivery status for delivery in 'deliveries' collection
		err = p.setDeliveryStatus(delivery.ID, constants.DeliveryStatusAwaitingPublishing, sessionCtx)
		if err != nil {
			session.AbortTransaction(sessionCtx)
			return err
		}

		return session.CommitTransaction(sessionCtx)
	})

	if err != nil {
		p.failAndUpdateStatus(delivery.ID, err)
	}

	session.EndSession(p.ctx)
}

func (p *Parser) setDeliveryStatus(documentId primitive.ObjectID, status string, ctx context.Context) error {
	update := bson.M{"$set": bson.M{"delivery_status": status}}
	_, err := p.deliveriesColl.UpdateByID(ctx, documentId, update)
	return err
}

func (p *Parser) failAndUpdateStatus(documentId primitive.ObjectID, err error) {
	p.setDeliveryStatus(documentId, constants.DeliveryStatusError, p.ctx)
	log.Fatal(err)
}
