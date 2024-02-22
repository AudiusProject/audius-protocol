package parser

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"ingester/common"
	"ingester/constants"
	"io"
	"log"
	"log/slog"
	"net/http"
	"strings"
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
	usersColl           *mongo.Collection
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
		usersColl:           mongoClient.Database("ddex").Collection("users"),
		ctx:                 ctx,
		logger:              logger,
	}

	if err := p.createArtistNameIndex(); err != nil {
		log.Fatal(err)
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

// createArtistNameIndex creates an index on the name (display name) field in the 'users' collection
func (p *Parser) createArtistNameIndex() error {
	_, err := p.usersColl.Indexes().CreateOne(p.ctx, mongo.IndexModel{
		Keys: bson.M{"name": 1},
	})
	if err != nil {
		return err
	}
	return nil
}

func (p *Parser) getArtistID(artistName string) (string, error) {
	// Search Mongo for an exact match on artist name
	filter := bson.M{"name": artistName}
	cursor, err := p.usersColl.Find(p.ctx, filter)
	if err != nil {
		return "", err
	}
	defer cursor.Close(p.ctx)

	var results []bson.M
	if err = cursor.All(p.ctx, &results); err != nil {
		return "", err
	}

	// Fail if multiple artists have their display name set to the same thing
	if len(results) > 1 {
		var matchingHandles []string
		for _, result := range results {
			if handle, ok := result["handle"].(string); ok {
				matchingHandles = append(matchingHandles, "@"+handle)
			}
		}

		// Join the artist IDs with commas
		idsStr := strings.Join(matchingHandles, ", ")

		return "", fmt.Errorf("error: more than one artist found with the same display name: : %s", idsStr)
	}

	// Fail if no artist is found, and use /v1/users/search to display potential matches in the error message
	if len(results) == 0 {
		return p.searchArtistOnAudius(artistName)
	}

	artistID, ok := results[0]["_id"].(string)
	if !ok {
		return "", errors.New("error: unable to parse artist ID")
	}
	return artistID, nil
}

func (p *Parser) searchArtistOnAudius(artistName string) (string, error) {
	type AudiusUser struct {
		Handle     string `json:"handle"`
		ID         string `json:"id"`
		IsVerified bool   `json:"is_verified"`
		Name       string `json:"name"`
	}

	url := fmt.Sprintf("https://discoveryprovider.audius.co/v1/users/search?query=%s", artistName)
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var data struct {
		Data []AudiusUser `json:"data"`
	}
	if err = json.Unmarshal(body, &data); err != nil {
		return "", err
	}

	// Include potential matches in the error message for manual review
	errMsg := "No artist found in the database. Found on Audius: "
	for _, user := range data.Data {
		errMsg += fmt.Sprintf("{ Handle: %s, ID: %s, Verified: %t, Name: %s } ", user.Handle, user.ID, user.IsVerified, user.Name)
	}
	return "", errors.New(errMsg)
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

	// If there's an album release, the tracks we parsed out are actually part of the album release
	if len(createAlbumRelease) > 0 {
		createTrackRelease = []common.CreateTrackRelease{}
	}

	// Find an ID for each artist name in the delivery

	for _, track := range createTrackRelease {
		artistID, err := p.getArtistID(track.Metadata.ArtistName)
		if err != nil {
			p.failAndUpdateStatus(delivery.ID, fmt.Errorf("track '%s' failed to find artist ID for '%s': %v", track.Metadata.Title, track.Metadata.ArtistName, err))
		}
		track.Metadata.ArtistID = artistID
	}

	for _, album := range createAlbumRelease {
		artistID, err := p.getArtistID(album.Metadata.PlaylistOwnerName)
		if err != nil {
			p.failAndUpdateStatus(delivery.ID, fmt.Errorf("album '%s' failed to find artist ID for '%s': %v", album.Metadata.PlaylistName, album.Metadata.PlaylistOwnerName, err))
		}
		album.Metadata.PlaylistOwnerID = artistID
	}

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
				"publish_date":         track.Metadata.ReleaseDate,
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
				"publish_date":         album.Metadata.ReleaseDate,
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
		err = p.setDeliveryStatus(delivery.ID, constants.DeliveryStatusAwaitingPublishing, nil, sessionCtx)
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

func (p *Parser) setDeliveryStatus(documentId primitive.ObjectID, status string, err error, ctx context.Context) error {
	var update bson.M
	if err != nil {
		update = bson.M{
			"$set":  bson.M{"delivery_status": status},
			"$push": bson.M{"errors": err.Error()},
		}
	} else {
		update = bson.M{"$set": bson.M{"delivery_status": status}}
	}

	_, updateErr := p.deliveriesColl.UpdateByID(ctx, documentId, update)
	return updateErr
}

func (p *Parser) failAndUpdateStatus(documentId primitive.ObjectID, err error) {
	updateErr := p.setDeliveryStatus(documentId, constants.DeliveryStatusError, err, p.ctx)
	if updateErr != nil {
		log.Fatal(fmt.Errorf("failed to set error on delivery status: %v. original err: %v", updateErr, err))
	} else {
		log.Fatal(err)
	}
}
