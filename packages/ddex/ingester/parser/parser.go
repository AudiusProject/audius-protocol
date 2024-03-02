package parser

import (
	"bytes"
	"context"
	"fmt"
	"ingester/artistutils"
	"ingester/common"
	"ingester/constants"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/antchfx/xmlquery"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type Parser struct {
	*common.BaseIngester
}

// RunNewParser continuously listens for new delivery documents in the Mongo "deliveries" collection and turns them into Audius track format
func RunNewParser(ctx context.Context) {
	p := &Parser{
		BaseIngester: common.NewBaseIngester(ctx, "parser"),
	}
	defer p.MongoClient.Disconnect(ctx)

	// Run migration to create artist name index
	if err := artistutils.CreateArtistNameIndex(p.UsersColl, p.Ctx); err != nil {
		log.Fatal(err)
	}

	p.ProcessChangeStream(p.DeliveriesColl, p.processDelivery)
}

func (p *Parser) processDelivery(changeStream *mongo.ChangeStream) {
	// Decode the delivery from Mongo
	var changeDoc struct {
		FullDocument common.Delivery `bson:"fullDocument"`
	}
	if err := changeStream.Decode(&changeDoc); err != nil {
		log.Fatal(err)
	}
	delivery := changeDoc.FullDocument
	if delivery.DeliveryStatus != constants.DeliveryStatusParsing {
		p.Logger.Info("Skipping delivery", "_id", delivery.ZIPFileETag, "delivery_status", delivery.DeliveryStatus)
		return
	}
	p.Logger.Info("Parsing releases from delivery", "_id", delivery.ZIPFileETag)

	// Parse the delivery's releases
	pendingReleases := []common.PendingRelease{}
	if p.DDEXChoreography == constants.ERNReleaseByRelease {
		for i := range delivery.Releases {
			release := delivery.Releases[i]
			morePendingReleases, err := p.parseRelease(&release, delivery.ZIPFileETag, "")
			if err == nil {
				pendingReleases = append(pendingReleases, *morePendingReleases...)
			} else {
				p.Logger.Error("Failed to process release", "error", err)
				p.replaceDelivery(&delivery)
				return
			}
		}
	} else {
		for i := range delivery.Batches {
			batch := delivery.Batches[i]
			morePendingReleases, err := p.parseBatch(&batch, delivery.ZIPFileETag)
			if err == nil {
				pendingReleases = append(pendingReleases, *morePendingReleases...)
			} else {
				p.Logger.Error("Failed to process batch", "error", err)
				p.replaceDelivery(&delivery)
				return
			}
		}
	}

	// Insert the parsed releases into the Mongo PendingReleases collection
	session, err := p.MongoClient.StartSession()
	if err != nil {
		err = fmt.Errorf("failed to start Mongo session: %v", err)
		delivery.DeliveryStatus = constants.DeliveryStatusErrorParsing
		delivery.ValidationErrors = append(delivery.ValidationErrors, err.Error())
		return
	}
	err = mongo.WithSession(p.Ctx, session, func(sessionCtx mongo.SessionContext) error {
		if err := session.StartTransaction(); err != nil {
			return err
		}
		defer session.EndSession(p.Ctx)

		// Create a PendingRelease doc for each parsed release
		for _, pendingRelease := range pendingReleases {
			result, err := p.PendingReleasesColl.InsertOne(p.Ctx, pendingRelease)
			if err != nil {
				session.AbortTransaction(sessionCtx)
				return err
			}
			p.Logger.Info("Inserted pending release", "_id", result.InsertedID)
		}

		delivery.DeliveryStatus = constants.DeliveryStatusSuccess
		return session.CommitTransaction(sessionCtx)
	})

	if err != nil {
		err = fmt.Errorf("failed to insert Mongo PendingRelease docs: %v", err)
		delivery.DeliveryStatus = constants.DeliveryStatusErrorParsing
		delivery.ValidationErrors = append(delivery.ValidationErrors, err.Error())
	}
}

// parseRelease takes an unprocessed release and turns it into PendingReleases (doesn't insert into Mongo)
func (p *Parser) parseRelease(release *common.UnprocessedRelease, deliveryZipFileETag, expectedERNVersion string) (*[]common.PendingRelease, error) {
	xmlData := release.XmlContent.Data
	doc, err := xmlquery.Parse(bytes.NewReader(xmlData))
	if err != nil {
		err = fmt.Errorf("failed to read XML bytes: %v", err)
		release.ValidationErrors = append(release.ValidationErrors, err.Error())
		return nil, err
	}

	// Use local-name() to ignore namespace because sometimes it's "ern" and sometimes it's "ernm"
	msgVersionElem := xmlquery.FindOne(doc, "//*[local-name()='NewReleaseMessage']")
	if msgVersionElem == nil {
		err = fmt.Errorf("Missing <NewReleaseMessage> element")
		release.ValidationErrors = append(release.ValidationErrors, err.Error())
		return nil, err
	}

	// Extract the ERN Version in the form of 'ern/xxx' or '/ern/xxx'
	msgSchemaVersionId := msgVersionElem.SelectAttr("MessageSchemaVersionId")
	ernVersion := strings.TrimPrefix(msgSchemaVersionId, "/")
	ernVersion = strings.TrimPrefix(ernVersion, "ern/")

	if expectedERNVersion != "" && ernVersion != expectedERNVersion {
		err = fmt.Errorf("expected ERN version '%s' but got '%s'", expectedERNVersion, ernVersion)
		release.ValidationErrors = append(release.ValidationErrors, err.Error())
		return nil, err
	}

	var createTrackRelease []common.CreateTrackRelease
	var createAlbumRelease []common.CreateAlbumRelease
	var errs []error
	switch ernVersion {
	// Not sure what the difference is between 3.81 and 3.82 because DDEX only provides the most recent version and 1 version behind unless you contact them
	case "381":
		createTrackRelease, createAlbumRelease, errs = parseERN38x(doc, p.CrawledBucket, release.ReleaseID)
	case "382":
		createTrackRelease, createAlbumRelease, errs = parseERN38x(doc, p.CrawledBucket, release.ReleaseID)
	default:
		err = fmt.Errorf("unsupported schema: '%s'. Expected ern/381 or ern/382", msgSchemaVersionId)
		release.ValidationErrors = append(release.ValidationErrors, err.Error())
		return nil, err
	}

	if len(errs) != 0 {
		for _, err := range errs {
			release.ValidationErrors = append(release.ValidationErrors, err.Error())
		}
		return nil, fmt.Errorf("failed to parse release: %v", errs)
	}
	p.Logger.Info("Parsed release", "createTrackRelease", fmt.Sprintf("%+v", createTrackRelease), "createAlbumRelease", fmt.Sprintf("%+v", createAlbumRelease))

	// If there's an album release, the tracks we parsed out are actually part of the album release
	if len(createAlbumRelease) > 0 {
		createTrackRelease = []common.CreateTrackRelease{}
	}

	// Find an ID for each artist name in the release

	for i := range createTrackRelease {
		track := &createTrackRelease[i]
		artistID, err := artistutils.GetArtistID(track.Metadata.ArtistName, p.UsersColl, p.Ctx)
		if err != nil {
			err = fmt.Errorf("track '%s' failed to find artist ID for '%s': %v", track.Metadata.Title, track.Metadata.ArtistName, err)
			release.ValidationErrors = append(release.ValidationErrors, err.Error())
			return nil, err
		}
		track.Metadata.ArtistID = artistID
	}

	for i := range createAlbumRelease {
		album := &createAlbumRelease[i]
		artistID, err := artistutils.GetArtistID(album.Metadata.PlaylistOwnerName, p.UsersColl, p.Ctx)
		if err != nil {
			err = fmt.Errorf("album '%s' failed to find artist ID for '%s': %v", album.Metadata.PlaylistName, album.Metadata.PlaylistOwnerName, err)
			release.ValidationErrors = append(release.ValidationErrors, err.Error())
			return nil, err
		}
		album.Metadata.PlaylistOwnerID = artistID
	}

	// Create (but don't yet insert into Mongo) a PendingRelease for each track and album release
	pendingReleases := []common.PendingRelease{}
	for _, track := range createTrackRelease {
		pendingRelease := common.PendingRelease{
			ReleaseID:          release.ReleaseID,
			DeliveryETag:       deliveryZipFileETag,
			CreateTrackRelease: track,
			PublishDate:        track.Metadata.ReleaseDate,
			CreatedAt:          time.Now(),
			PublishErrors:      []string{},
			FailureCount:       0,
			FailedAfterUpload:  false,
		}
		pendingReleases = append(pendingReleases, pendingRelease)
	}
	for _, album := range createAlbumRelease {
		pendingRelease := common.PendingRelease{
			ReleaseID:          release.ReleaseID,
			DeliveryETag:       deliveryZipFileETag,
			CreateAlbumRelease: album,
			PublishDate:        album.Metadata.ReleaseDate,
			CreatedAt:          time.Now(),
			PublishErrors:      []string{},
			FailureCount:       0,
			FailedAfterUpload:  false,
		}
		pendingReleases = append(pendingReleases, pendingRelease)
	}

	return &pendingReleases, nil
}

// parseBatch takes an unprocessed batch and turns it into PendingReleases (doesn't insert into Mongo)
func (p *Parser) parseBatch(batch *common.UnprocessedBatch, deliveryZipFileETag string) (*[]common.PendingRelease, error) {
	xmlData := batch.BatchXmlContent.Data
	doc, err := xmlquery.Parse(bytes.NewReader(xmlData))
	if err != nil {
		err = fmt.Errorf("failed to read XML bytes: %v", err)
		batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
		return nil, err
	}

	// Parse the batch's DDEX schema version
	ernmAttr := xmlquery.FindOne(doc, "//@xmlns:ernm")
	if ernmAttr == nil {
		err = fmt.Errorf("xmlns:ernm attribute not found")
		batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
		return nil, err
	}
	ernVersion, ok := strings.CutPrefix(ernmAttr.InnerText(), "http://ddex.net/xml/ern/")
	if !ok {
		err = fmt.Errorf("unexpected xmlns:ernm value: %s", ernmAttr.InnerText())
		batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
		return nil, err
	}

	// Parse NumberOfMessages
	numMessagesNode := xmlquery.FindOne(doc, "//NumberOfMessages")
	if numMessagesNode == nil {
		err := fmt.Errorf("NumberOfMessages element not found")
		batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
		return nil, err
	}
	numMessages, err := strconv.Atoi(numMessagesNode.InnerText())
	if err != nil {
		err := fmt.Errorf("failed to parse NumberOfMessages value: %v", err)
		batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
		return nil, err
	}

	batch.DDEXSchema = ernVersion
	batch.NumMessages = numMessages

	if numMessages != len(batch.Releases) {
		err := fmt.Errorf("NumberOfMessages value %d does not match the number of releases %d", numMessages, len(batch.Releases))
		batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
		return nil, err
	}

	// Parse each MessageInBatch
	var pendingReleases []common.PendingRelease
	for i := 1; i <= numMessages; i++ {
		messageInBatch := xmlquery.FindOne(doc, fmt.Sprintf("//MessageInBatch[%d]", i))
		if messageInBatch == nil {
			err := fmt.Errorf("MessageInBatch %d not found", i)
			batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
			return nil, err
		}

		// TODO: Handle updates and deletes
		deliveryType := safeInnerText(messageInBatch.SelectElement("DeliveryType"))
		if deliveryType != "NewReleaseDelivery" {
			err := fmt.Errorf("DeliveryType %s not supported", deliveryType)
			batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
			return nil, err
		}

		productType := safeInnerText(messageInBatch.SelectElement("ProductType"))
		if productType != "AudioProduct" {
			err := fmt.Errorf("ProductType %s not supported", productType)
			batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
			return nil, err
		}

		// TODO: Support more ID types (GRid is preferred) as we get more examples
		var releaseID string
		releaseICPN := safeInnerText(messageInBatch.SelectElement("IncludedReleaseId/ICPN"))
		if releaseICPN != "" {
			releaseID = releaseICPN
			// } else if releaseGRid != "" {
			// 	releaseID = releaseGRid
		} else {
			err := fmt.Errorf("no valid IncludedReleaseId found")
			batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
			return nil, err
		}

		// Find the release with the given releaseID in the batch's Releases
		// TODO: Should probably make Releases and Batches maps instead of slices
		var targetRelease *common.UnprocessedRelease
		for _, release := range batch.Releases {
			if release.ReleaseID == releaseID {
				targetRelease = &release
				break
			}
		}
		if targetRelease == nil {
			err := fmt.Errorf("release with ID '%s' not found in batch's Releases", releaseID)
			batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
			return nil, err
		}

		releaseURL := safeInnerText(messageInBatch.SelectElement("URL"))
		expectedReleaseURL := fmt.Sprintf("/%s/%s", batch.BatchID, targetRelease.XmlFilePath)
		if releaseURL != expectedReleaseURL {
			err := fmt.Errorf("URL '%s' does not match expected value", releaseURL)
			batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
			return nil, err
		}

		// Parse the release using parseRelease function
		pendingRelease, err := p.parseRelease(targetRelease, deliveryZipFileETag, ernVersion)
		if err != nil {
			return nil, err
		}
		pendingReleases = append(pendingReleases, *pendingRelease...)
	}

	return &pendingReleases, nil
}

func (p *Parser) replaceDelivery(updatedDelivery *common.Delivery) {
	_, replaceErr := p.DeliveriesColl.ReplaceOne(p.Ctx, bson.M{"_id": updatedDelivery.ZIPFileETag}, updatedDelivery)
	if replaceErr != nil {
		p.Logger.Error("Failed to replace delivery", "_id", updatedDelivery.ZIPFileETag, "error", replaceErr)
	}
}
