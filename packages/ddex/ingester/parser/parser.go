package parser

import (
	"bytes"
	"fmt"
	"ingester/artistutils"
	"ingester/common"
	"ingester/constants"
	"strconv"
	"strings"
	"time"

	"github.com/antchfx/xmlquery"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Parser struct {
	*common.Ingester
}

func NewParser(i *common.Ingester) *Parser {
	return &Parser{i}
}

// ParseRelease (idempotent) processes the raw XML of a release to (re-)populate the release document's other fields
func (p *Parser) ParseRelease(release *common.Release) (ok bool) {
	// Reset fields that we're about to parse in case this is a retry
	release.ReleaseProfile = ""
	release.ParsedReleaseElems = []common.ParsedReleaseElement{}
	release.SDKUploadMetadata = common.SDKUploadMetadata{}
	release.ParseErrors = []string{}

	logParsingErr := func(e error) {
		release.ParseErrors = append(release.ParseErrors, e.Error())
		release.ReleaseStatus = constants.ReleaseStatusErrorParsing
	}

	// Upsert the release after parsing regardless of success or failure
	defer func() {
		filter := bson.M{"_id": release.ReleaseID}
		var existingRelease common.Release

		// Find the existing document, if any
		err := p.ReleasesColl.FindOne(p.Ctx, filter).Decode(&existingRelease)
		if err == nil {
			if existingRelease.ReleaseStatus == constants.ReleaseStatusPublished || existingRelease.ReleaseStatus == constants.ReleaseStatusFailedAfterUpload {
				// Set is_update to true if the existing release has already been published to Audius
				release.IsUpdate = true
			}
		}

		if res, err := p.UpsertRelease(release); err == nil {
			p.Logger.Info("Upserted release", "_id", res.UpsertedID, "modified", res.ModifiedCount)
			ok = true
		} else {
			p.Logger.Error("failed to upsert Mongo Release doc", "err", err)
			ok = false
		}
	}()

	// If this has a batch, parse that first
	batchERNVersion := ""
	if release.BatchID != "" {
		// Get the batch's XML from Mongo
		batchRes := p.BatchesColl.FindOne(p.Ctx, primitive.M{"_id": release.BatchID})
		if batchRes == nil {
			logParsingErr(fmt.Errorf("batch '%s' not found", release.BatchID))
			return
		}

		// Parse the batch's XML and validate that the release is in it
		var batch common.Batch
		if err := batchRes.Decode(&batch); err != nil {
			logParsingErr(fmt.Errorf("failed to decode batch '%s': %v", release.BatchID, err))
			return
		}
		if batchXMLDoc, err := p.parseBatch(&batch); err != nil {
			logParsingErr(fmt.Errorf("failed to parse batch '%s': %v", release.BatchID, err))
			return
		} else {
			if err := p.validateReleaseIsInBatch(release, &batch, batchXMLDoc); err != nil {
				logParsingErr(fmt.Errorf("failed to validate release in batch '%s': %v", release.BatchID, err))
				return
			}
		}
		batchERNVersion = batch.DDEXSchema
	}

	xmlData := release.RawXML.Data
	doc, err := xmlquery.Parse(bytes.NewReader(xmlData))
	if err != nil {
		logParsingErr(fmt.Errorf("failed to read XML bytes: %v", err))
		return
	}

	// Use local-name() to ignore namespace because sometimes it's "ern" and sometimes it's "ernm"
	msgVersionElem := xmlquery.FindOne(doc, "//*[local-name()='NewReleaseMessage']")
	if msgVersionElem == nil {
		logParsingErr(fmt.Errorf("missing <NewReleaseMessage> element"))
		return
	}

	// Extract the ERN Version in the form of 'ern/xxx' or '/ern/xxx'
	msgSchemaVersionId := msgVersionElem.SelectAttr("MessageSchemaVersionId")
	ernVersion := strings.TrimPrefix(msgSchemaVersionId, "/")
	ernVersion = strings.TrimPrefix(ernVersion, "ern/")
	batchERNVersion = strings.TrimPrefix(batchERNVersion, "ern/")

	if batchERNVersion != "" && ernVersion != batchERNVersion {
		logParsingErr(fmt.Errorf("expected ERN version '%s' but got '%s'", batchERNVersion, ernVersion))
		return
	}

	// Extract the release profile. See https://kb.ddex.net/implementing-each-standard/electronic-release-notification-message-suite-(ern)/ern-3-explained/ern-3-profiles/release-profiles-in-ern-3/
	releaseProfileVersionIDStr := msgVersionElem.SelectAttr("ReleaseProfileVersionId")
	var releaseProfile common.ReleaseProfile
	switch releaseProfileVersionIDStr {
	case string(common.Common13AudioSingle):
		releaseProfile = common.Common13AudioSingle
	case string(common.Common14AudioAlbumMusicOnly):
		releaseProfile = common.Common14AudioAlbumMusicOnly
	default:
		releaseProfile = common.UnspecifiedReleaseProfile
	}

	release.ReleaseProfile = releaseProfile
	release.ParsedReleaseElems = []common.ParsedReleaseElement{}
	var errs []error
	switch ernVersion {
	// Not sure what the difference is between 3.81 and 3.82 because DDEX only provides the most recent version and 1 version behind unless you contact them
	case "381":
		errs = parseERN38x(doc, p.Bucket, release, p.ReleasesColl)
	case "382":
		errs = parseERN38x(doc, p.Bucket, release, p.ReleasesColl)
	default:
		logParsingErr(fmt.Errorf("unsupported schema: '%s'. Expected ern/381 or ern/382", msgSchemaVersionId))
		return
	}

	if len(errs) != 0 {
		for _, err := range errs {
			logParsingErr(err)
		}
		return
	}

	if release.ReleaseStatus == constants.ReleaseStatusDeleted || release.ReleaseStatus == constants.ReleaseStatusAwaitingDelete {
		p.Logger.Info("Parsed takedown release", "id", release.ReleaseID)
		return
	} else {
		p.Logger.Info("Parsed release", "id", release.ReleaseID)
	}

	// Find an ID for the first OAuthed display artist in the release
	for i, parsedRelease := range release.ParsedReleaseElems {
		artistID, artistName, warnings, err := artistutils.GetFirstArtistID(parsedRelease.Artists, p.UsersColl, p.Ctx)
		if warnings != nil {
			p.Logger.Info("Warnings while finding an artist ID for release", "display title", parsedRelease.DisplayTitle, "display artists", parsedRelease.Artists, "warnings", fmt.Sprintf("%+v", warnings))
		}
		if err != nil {
			logParsingErr(fmt.Errorf("failed to find an artist ID from display artists %+v: %v", parsedRelease.Artists, err))
			release.ReleaseStatus = constants.ReleaseStatusErrorUserMatch
			return
		}
		p.Logger.Info("Found artist ID for release", "artistID", artistID, "artistName", artistName, "display title", parsedRelease.DisplayTitle, "display artists", parsedRelease.Artists)
		parsedRelease.ArtistID = artistID
		// Use this artist ID in conditions for follow/tip stream/download gates
		if parsedRelease.IsStreamFollowGated {
			parsedRelease.StreamConditions = &common.AccessConditions{
				FollowUserID: artistID,
			}
		} else if parsedRelease.IsStreamTipGated {
			parsedRelease.StreamConditions = &common.AccessConditions{
				TipUserID: artistID,
			}
		}
		if parsedRelease.IsDownloadFollowGated {
			parsedRelease.DownloadConditions = &common.AccessConditions{
				FollowUserID: artistID,
			}
		}

		// Verify release element has a corresponding deal (only required for tracks for now)
		if parsedRelease.ReleaseType == common.TrackReleaseType {
			if !parsedRelease.HasDeal {
				logParsingErr(fmt.Errorf("missing deal for release ref '%s' does not have a corresponding deal", parsedRelease.ReleaseRef))
				return
			}
		}
		// For albums/EPs without a ValidityStartDate: use the latest ValidityStartDate from the tracks on the album.
		// This case is possible because deals for tracks are required but a deal for the album release is not required.
		if parsedRelease.IsMainRelease && parsedRelease.ReleaseType != common.TrackReleaseType && parsedRelease.ValidityStartDate.IsZero() {
			var maxTrackValidityStartDate time.Time
			for _, elem := range release.ParsedReleaseElems {
				if elem.IsMainRelease {
					continue
				}
				if elem.ValidityStartDate.After(maxTrackValidityStartDate) {
					maxTrackValidityStartDate = elem.ValidityStartDate
				}
			}
			parsedRelease.ValidityStartDate = maxTrackValidityStartDate
		}

		// Verify release has a nonzero ValidityStartDate
		if parsedRelease.ValidityStartDate.IsZero() {
			logParsingErr(fmt.Errorf("invalid validity start date for release ref '%s'", parsedRelease.ReleaseRef))
			return
		}

		// Use ValidityStartDate as ReleaseDate if a ReleaseDate is not provided
		if parsedRelease.ReleaseDate.IsZero() {
			parsedRelease.ReleaseDate = parsedRelease.ValidityStartDate
		}

		release.ParsedReleaseElems[i] = parsedRelease
	}

	sdkErrs := buildSDKMetadataERN38x(release)
	if len(sdkErrs) != 0 {
		for _, err := range sdkErrs {
			logParsingErr(err)
		}
		return
	}

	release.ReleaseStatus = constants.ReleaseStatusAwaitingPublish
	return
}

// parseBatch (idempotent) (re-)populates the batch's fields from the raw XML data
func (p *Parser) parseBatch(batch *common.Batch) (*xmlquery.Node, error) {
	// Reset fields that we're about to parse in case this is a retry
	batch.DDEXSchema = ""
	batch.NumMessages = 0

	// Upsert the batch after parsing regardless of success or failure
	defer func() {
		if _, err := p.UpsertBatch(batch); err != nil {
			p.Logger.Error("failed to upsert batch", "err", err)
		}
	}()

	xmlData := batch.BatchXML.Data
	doc, err := xmlquery.Parse(bytes.NewReader(xmlData))
	if err != nil {
		return nil, fmt.Errorf("failed to read XML bytes: %v", err)
	}

	// Parse the batch's DDEX schema version. Some test deliveries use xmlns:ernm, while others uses xmlns:ern-c
	ernmAttr := xmlquery.FindOne(doc, "//@xmlns:ernm")
	erncAttr := xmlquery.FindOne(doc, "//@xmlns:ern-c")
	if ernmAttr != nil && strings.HasPrefix(ernmAttr.InnerText(), "http://ddex.net/xml/ern/") {
		batch.DDEXSchema = strings.Split(ernmAttr.InnerText(), "http://ddex.net/xml/ern/")[1]
	} else if erncAttr != nil && erncAttr.InnerText() == "http://ddex.net/xml/ern-c/15" {
		batch.DDEXSchema = "ern/382"
	} else {
		return nil, fmt.Errorf("missing or unexpected xmlns:ernm and xmlns:ern-c")
	}

	// Parse NumberOfMessages
	numMessagesNode := xmlquery.FindOne(doc, "//NumberOfMessages")
	if numMessagesNode == nil {
		return nil, fmt.Errorf("NumberOfMessages element not found")
	}
	numMessages, err := strconv.Atoi(numMessagesNode.InnerText())
	if err != nil {
		return nil, fmt.Errorf("failed to parse NumberOfMessages value: %v", err)
	}
	batch.NumMessages = numMessages

	return doc, nil
}

func (p *Parser) validateReleaseIsInBatch(release *common.Release, batch *common.Batch, doc *xmlquery.Node) error {
	// Loop the batch's releases to find a match
	for i := 1; i <= batch.NumMessages; i++ {
		messageInBatch := xmlquery.FindOne(doc, fmt.Sprintf("//MessageInBatch[%d]", i))
		if messageInBatch == nil {
			continue
		}

		// TODO: Support more ID types (GRid is preferred) as we get more examples
		var releaseID string
		releaseICPN := safeInnerText(messageInBatch.SelectElement("IncludedReleaseId/ICPN"))
		releaseGRid := safeInnerText(messageInBatch.SelectElement("IncludedReleaseId/GRid"))
		if releaseICPN != "" {
			releaseID = releaseICPN
		} else if releaseGRid != "" {
			releaseID = releaseGRid
		} else {
			p.Logger.Warn(fmt.Sprintf("no valid IncludedReleaseId found for message %d in batch '%s'", i, batch.BatchID))
			continue
		}

		// We found the release in the batch, so do some validation on it
		if releaseID == release.ReleaseID {
			// TODO: Handle updates and deletes
			deliveryType := safeInnerText(messageInBatch.SelectElement("DeliveryType"))
			if deliveryType != "NewReleaseDelivery" {
				return fmt.Errorf("DeliveryType %s not supported", deliveryType)
			}

			productType := safeInnerText(messageInBatch.SelectElement("ProductType"))
			if productType != "AudioProduct" {
				return fmt.Errorf("ProductType %s not supported", productType)
			}

			// Validate the URL without the prefix "/"
			releaseURL := strings.TrimPrefix(safeInnerText(messageInBatch.SelectElement("URL")), "/")

			// Special case for Fuga deliveries with a different URL format
			if strings.Contains(releaseURL, "ddex-prod-fuga-raw//") {
				releaseURL = strings.SplitAfter(releaseURL, "ddex-prod-fuga-raw//")[1]
				releaseURL = fmt.Sprintf("%s/%s", strings.Split(release.XMLRemotePath, "/")[3], releaseURL)
			}
			if !strings.HasPrefix(releaseURL, "s3://") {
				releaseURL = fmt.Sprintf("s3://%s/%s", p.Bucket, releaseURL)
			}

			if releaseURL != release.XMLRemotePath {
				return fmt.Errorf("URL '%s' does not match expected value: '%s'", releaseURL, release.XMLRemotePath)
			}

			// Validation passed!
			return nil
		}
	}

	return fmt.Errorf("no matching release found in batch")
}
