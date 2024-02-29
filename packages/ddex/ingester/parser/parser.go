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
	"net/http"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type Parser struct {
	*common.BaseIngester
}

// RunNewParser starts the parser service, which listens for new delivery documents in the Mongo "deliveries" collection and turns them into Audius format track format.
func RunNewParser(ctx context.Context) {
	p := &Parser{
		BaseIngester: common.NewBaseIngester(ctx, "parser"),
	}
	defer p.MongoClient.Disconnect(ctx)

	// Run migration to create artist name index
	if err := p.createArtistNameIndex(); err != nil {
		log.Fatal(err)
	}

	p.ProcessChangeStream(p.DeliveriesColl, p.processDelivery)
}

// createArtistNameIndex creates an index on the name (display name) field in the 'users' collection
func (p *Parser) createArtistNameIndex() error {
	_, err := p.UsersColl.Indexes().CreateOne(p.Ctx, mongo.IndexModel{
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
	cursor, err := p.UsersColl.Find(p.Ctx, filter)
	if err != nil {
		return "", err
	}
	defer cursor.Close(p.Ctx)

	var results []bson.M
	if err = cursor.All(p.Ctx, &results); err != nil {
		return "", err
	}

	// Fail if multiple artists have their display name set to the same string
	if len(results) > 1 {
		var handles []string
		for _, result := range results {
			if handle, ok := result["handle"].(string); ok {
				handles = append(handles, "@"+handle)
			}
		}
		idsStr := strings.Join(handles, ", ")
		return "", fmt.Errorf("error: more than one artist found with the same display name: %s", idsStr)
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
	if delivery.DeliveryStatus != constants.DeliveryStatusValidating {
		p.Logger.Info("Skipping delivery", "_id", delivery.ID, "status", delivery.DeliveryStatus)
		return
	}
	p.Logger.Info("Processing new delivery", "_id", delivery.ID)

	xmlData := delivery.XmlContent.Data
	createTrackRelease, createAlbumRelease, errs := parseSonyXML(xmlData, p.IndexedBucket, delivery.ID.Hex())
	if len(errs) != 0 {
		p.Logger.Error("Failed to parse delivery. Printing errors...")
		for _, err := range errs {
			p.Logger.Error(err.Error())
		}
		p.failAndUpdateStatus(delivery.ID, fmt.Errorf("failed to parse delivery: %v", errs))
		return
	}
	p.Logger.Info("Parsed delivery", "createTrackRelease", fmt.Sprintf("%+v", createTrackRelease), "createAlbumRelease", fmt.Sprintf("%+v", createAlbumRelease))

	// If there's an album release, the tracks we parsed out are actually part of the album release
	if len(createAlbumRelease) > 0 {
		createTrackRelease = []common.CreateTrackRelease{}
	}

	// Find an ID for each artist name in the delivery

	for i := range createTrackRelease {
		track := &createTrackRelease[i]
		artistID, err := p.getArtistID(track.Metadata.ArtistName)
		if err != nil {
			p.failAndUpdateStatus(delivery.ID, fmt.Errorf("track '%s' failed to find artist ID for '%s': %v", track.Metadata.Title, track.Metadata.ArtistName, err))
			return
		}
		track.Metadata.ArtistID = artistID
	}

	for i := range createAlbumRelease {
		album := &createAlbumRelease[i]
		artistID, err := p.getArtistID(album.Metadata.PlaylistOwnerName)
		if err != nil {
			p.failAndUpdateStatus(delivery.ID, fmt.Errorf("album '%s' failed to find artist ID for '%s': %v", album.Metadata.PlaylistName, album.Metadata.PlaylistOwnerName, err))
			return
		}
		album.Metadata.PlaylistOwnerID = artistID
	}

	session, err := p.MongoClient.StartSession()
	if err != nil {
		p.failAndUpdateStatus(delivery.ID, err)
		return
	}
	err = mongo.WithSession(p.Ctx, session, func(sessionCtx mongo.SessionContext) error {
		if err := session.StartTransaction(); err != nil {
			return err
		}
		defer session.EndSession(p.Ctx)

		// 2. Write each release in "delivery_xml" in the delivery as a bson doc in the 'pending_releases' collection
		for _, track := range createTrackRelease {
			pendingRelease := bson.M{
				"upload_etag":          delivery.UploadETag,
				"delivery_id":          delivery.ID,
				"create_track_release": track,
				"publish_date":         track.Metadata.ReleaseDate,
				"created_at":           time.Now(),
			}
			result, err := p.PendingReleasesColl.InsertOne(p.Ctx, pendingRelease)
			if err != nil {
				session.AbortTransaction(sessionCtx)
				return err
			}
			p.Logger.Info("Inserted pending track release", "_id", result.InsertedID)
		}
		for _, album := range createAlbumRelease {
			pendingRelease := bson.M{
				"upload_etag":          delivery.UploadETag,
				"delivery_id":          delivery.ID,
				"create_album_release": album,
				"publish_date":         album.Metadata.ReleaseDate,
				"created_at":           time.Now(),
			}
			result, err := p.PendingReleasesColl.InsertOne(p.Ctx, pendingRelease)
			if err != nil {
				session.AbortTransaction(sessionCtx)
				return err
			}
			p.Logger.Info("Inserted pending album release", "_id", result.InsertedID)
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

	_, updateErr := p.DeliveriesColl.UpdateByID(ctx, documentId, update)
	return updateErr
}

func (p *Parser) failAndUpdateStatus(documentID primitive.ObjectID, err error) {
	updateErr := p.setDeliveryStatus(documentID, constants.DeliveryStatusError, err, p.Ctx)
	if updateErr != nil {
		p.Logger.Error("Failed to set error on delivery status", "documentID", documentID, "updateErr", updateErr, "originalErr", err)
	} else {
		p.Logger.Error("Set delivery status to error", "documentID", documentID, "error", err)
	}
}
