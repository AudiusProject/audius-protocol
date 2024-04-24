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
)

type Parser struct {
	*common.Ingester
}

func NewParser(i *common.Ingester) *Parser {
	return &Parser{i}
}

// ProcessDelivery takes a delivery and processes it into PendingReleases (Audius-ready format)
func (p *Parser) ProcessDelivery(delivery *common.Delivery) {
	p.Logger.Info("Parsing releases from delivery", "_id", delivery.RemotePath)
	defer p.insertDelivery(delivery)

	if len(delivery.Releases) == 0 && len(delivery.Batches) == 0 {
		delivery.DeliveryStatus = constants.DeliveryStatusErrorParsing
		delivery.ValidationErrors = append(delivery.ValidationErrors, "no releases or batches found")
		p.Logger.Warn("No releases or batches found in delivery", "remotePath", delivery.RemotePath)
		return
	}

	// Parse the delivery's releases
	pendingReleases := []*common.PendingRelease{}
	if p.DDEXChoreography == constants.ERNReleaseByRelease {
		for i := range delivery.Releases {
			release := &delivery.Releases[i]
			morePendingReleases, err := p.parseRelease(release, delivery.RemotePath, "")
			if err == nil {
				pendingReleases = append(pendingReleases, morePendingReleases...)
			} else {
				delivery.DeliveryStatus = constants.DeliveryStatusErrorParsing
				p.Logger.Error("Failed to process release", "error", err)
				return
			}
		}
	} else {
		for i := range delivery.Batches {
			batch := &delivery.Batches[i]
			morePendingReleases, err := p.parseBatch(batch, delivery.RemotePath)
			if err == nil {
				pendingReleases = append(pendingReleases, morePendingReleases...)
			} else {
				delivery.DeliveryStatus = constants.DeliveryStatusErrorParsing
				p.Logger.Error("Failed to process batch", "error", err)
				return
			}
		}
	}

	// Insert a PendingRelease doc for each parsed release
	for _, pendingRelease := range pendingReleases {
		result, err := p.PendingReleasesColl.InsertOne(p.Ctx, pendingRelease)
		if err == nil {
			p.Logger.Info("Inserted pending release", "_id", result.InsertedID)
		} else {
			err = fmt.Errorf("failed to insert Mongo PendingRelease docs: %v", err)
			delivery.DeliveryStatus = constants.DeliveryStatusErrorParsing
			delivery.ValidationErrors = append(delivery.ValidationErrors, err.Error())
		}
	}

	// Set the delivery to successful if all releases were parsed successfully
	if delivery.DeliveryStatus == constants.DeliveryStatusParsing {
		delivery.DeliveryStatus = constants.DeliveryStatusSuccess
	}
}

// parseRelease takes an unprocessed release and turns it into PendingReleases (doesn't insert into Mongo)
func (p *Parser) parseRelease(unprocessedRelease *common.UnprocessedRelease, deliveryRemotePath, expectedERNVersion string) ([]*common.PendingRelease, error) {
	xmlData := unprocessedRelease.XmlContent.Data
	doc, err := xmlquery.Parse(bytes.NewReader(xmlData))
	if err != nil {
		err = fmt.Errorf("failed to read XML bytes: %v", err)
		unprocessedRelease.ValidationErrors = append(unprocessedRelease.ValidationErrors, err.Error())
		return nil, err
	}

	// Use local-name() to ignore namespace because sometimes it's "ern" and sometimes it's "ernm"
	msgVersionElem := xmlquery.FindOne(doc, "//*[local-name()='NewReleaseMessage']")
	if msgVersionElem == nil {
		err = fmt.Errorf("missing <NewReleaseMessage> element")
		unprocessedRelease.ValidationErrors = append(unprocessedRelease.ValidationErrors, err.Error())
		return nil, err
	}

	// Extract the ERN Version in the form of 'ern/xxx' or '/ern/xxx'
	msgSchemaVersionId := msgVersionElem.SelectAttr("MessageSchemaVersionId")
	ernVersion := strings.TrimPrefix(msgSchemaVersionId, "/")
	ernVersion = strings.TrimPrefix(ernVersion, "ern/")
	expectedERNVersion = strings.TrimPrefix(expectedERNVersion, "ern/")

	if expectedERNVersion != "" && ernVersion != expectedERNVersion {
		err = fmt.Errorf("expected ERN version '%s' but got '%s'", expectedERNVersion, ernVersion)
		unprocessedRelease.ValidationErrors = append(unprocessedRelease.ValidationErrors, err.Error())
		return nil, err
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

	release := &common.Release{
		ReleaseProfile:     releaseProfile,
		ParsedReleaseElems: []common.ParsedReleaseElement{},
	}
	var errs []error
	switch ernVersion {
	// Not sure what the difference is between 3.81 and 3.82 because DDEX only provides the most recent version and 1 version behind unless you contact them
	case "381":
		errs = parseERN38x(doc, p.CrawledBucket, unprocessedRelease.ReleaseID, release)
	case "382":
		errs = parseERN38x(doc, p.CrawledBucket, unprocessedRelease.ReleaseID, release)
	default:
		err = fmt.Errorf("unsupported schema: '%s'. Expected ern/381 or ern/382", msgSchemaVersionId)
		unprocessedRelease.ValidationErrors = append(unprocessedRelease.ValidationErrors, err.Error())
		return nil, err
	}

	if len(errs) != 0 {
		for _, err := range errs {
			unprocessedRelease.ValidationErrors = append(unprocessedRelease.ValidationErrors, err.Error())
		}
		return nil, fmt.Errorf("failed to parse release: %v", errs)
	}
	p.Logger.Info("Parsed release", "id", unprocessedRelease.ReleaseID)

	// Find an ID for the first OAuthed display artist in the release
	for i, parsedRelease := range release.ParsedReleaseElems {
		artistID, artistName, warnings, err := artistutils.GetFirstArtistID(parsedRelease.Artists, p.UsersColl, p.Ctx)
		if warnings != nil {
			p.Logger.Info("Warnings while finding an artist ID for release", "display title", parsedRelease.DisplayTitle, "display artists", parsedRelease.Artists, "warnings", fmt.Sprintf("%+v", warnings))
		}
		if err != nil {
			err = fmt.Errorf("release '%s' failed to find an artist ID from display artists %+v: %v", parsedRelease.DisplayTitle, parsedRelease.Artists, err)
			unprocessedRelease.ValidationErrors = append(unprocessedRelease.ValidationErrors, err.Error())
			return nil, err
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
				err = fmt.Errorf("release '%s' (ref %s) does not have a corresponding deal", parsedRelease.DisplayTitle, parsedRelease.ReleaseRef)
				unprocessedRelease.ValidationErrors = append(unprocessedRelease.ValidationErrors, err.Error())
				return nil, err
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
			err = fmt.Errorf("release '%s' (ref %s) does not have valid validity start date", parsedRelease.DisplayTitle, parsedRelease.ReleaseRef)
			unprocessedRelease.ValidationErrors = append(unprocessedRelease.ValidationErrors, err.Error())
			return nil, err
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
			unprocessedRelease.ValidationErrors = append(unprocessedRelease.ValidationErrors, err.Error())
		}
		return nil, fmt.Errorf("failed to build SDK metadata for release: %v", errs)
	}

	// Create (but don't yet insert into Mongo) a PendingRelease for each track and album release
	pendingReleases := []*common.PendingRelease{}
	pendingReleases = append(pendingReleases, &common.PendingRelease{
		ReleaseID:          unprocessedRelease.ReleaseID,
		DeliveryRemotePath: deliveryRemotePath,
		Release:            *release,
		CreatedAt:          time.Now(),
		PublishErrors:      []string{},
		FailureCount:       0,
		FailedAfterUpload:  false,
	})

	return pendingReleases, nil
}

// parseBatch takes an unprocessed batch and turns it into PendingReleases (doesn't insert into Mongo)
func (p *Parser) parseBatch(batch *common.UnprocessedBatch, deliveryRemotePath string) ([]*common.PendingRelease, error) {
	xmlData := batch.BatchXmlContent.Data
	doc, err := xmlquery.Parse(bytes.NewReader(xmlData))
	if err != nil {
		err = fmt.Errorf("failed to read XML bytes: %v", err)
		batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
		return nil, err
	}

	// Parse the batch's DDEX schema version
	ernmAttr := xmlquery.FindOne(doc, "//@xmlns:ernm")
	erncAttr := xmlquery.FindOne(doc, "//@xmlns:ern-c")
	var ernVersion string
	var ok bool

	// Some Spotify test deliveries use xmlns:ernm, while Fuga uses xmlns:ern-c
	if ernmAttr != nil {
		ernVersion, ok = strings.CutPrefix(ernmAttr.InnerText(), "http://ddex.net/xml/ern/")
		if !ok {
			err = fmt.Errorf("unexpected xmlns:ernm value: %s", ernmAttr.InnerText())
			batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
			return nil, err
		}
	} else if erncAttr != nil {
		if erncAttr.InnerText() == "http://ddex.net/xml/ern-c/15" {
			ernVersion = "ern/382"
		} else {
			err = fmt.Errorf("unexpected xmlns:ern-c value: %s", erncAttr.InnerText())
			batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
			return nil, err
		}
	} else {
		err = fmt.Errorf("no xmlns:ernm or xmlns:ern-c attribute found")
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
	var pendingReleases []*common.PendingRelease
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
		releaseGRid := safeInnerText(messageInBatch.SelectElement("IncludedReleaseId/GRid"))
		if releaseICPN != "" {
			releaseID = releaseICPN
		} else if releaseGRid != "" {
			releaseID = releaseGRid
		} else {
			err := fmt.Errorf("no valid IncludedReleaseId found")
			batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
			return nil, err
		}

		// Find the release with the given releaseID in the batch's Releases
		var targetRelease *common.UnprocessedRelease
		for i := range batch.Releases {
			if batch.Releases[i].ReleaseID == releaseID {
				targetRelease = &batch.Releases[i]
				break
			}
		}
		if targetRelease == nil {
			err := fmt.Errorf("release with ID '%s' not found in batch's Releases", releaseID)
			batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
			return nil, err
		}

		// Validate the URL without the prefix "/"
		releaseURL := strings.TrimPrefix(safeInnerText(messageInBatch.SelectElement("URL")), "/")

		// Special case for Fuga deliveries with a different URL format
		if strings.Contains(releaseURL, "ddex-prod-fuga-raw") {
			releaseURL = strings.SplitAfter(releaseURL, "ddex-prod-fuga-raw//")[1]
			releaseURL = fmt.Sprintf("%s/%s", strings.Split(targetRelease.XmlFilePath, "/")[0], releaseURL)
		}

		if releaseURL != targetRelease.XmlFilePath {
			err := fmt.Errorf("URL '%s' does not match expected value: '%s'", releaseURL, targetRelease.XmlFilePath)
			batch.ValidationErrors = append(batch.ValidationErrors, err.Error())
			return nil, err
		}

		// Parse the release using parseRelease function
		pendingRelease, err := p.parseRelease(targetRelease, deliveryRemotePath, ernVersion)
		if err != nil {
			return nil, err
		}
		pendingReleases = append(pendingReleases, pendingRelease...)
	}

	return pendingReleases, nil
}

func (p *Parser) insertDelivery(delivery *common.Delivery) {
	_, replaceErr := p.DeliveriesColl.InsertOne(p.Ctx, *delivery)
	if replaceErr != nil {
		p.Logger.Error("Failed to insert delivery", "_id", delivery.RemotePath, "error", replaceErr)
	}
}
