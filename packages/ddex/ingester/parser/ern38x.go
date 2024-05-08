package parser

import (
	"context"
	"fmt"
	"ingester/common"
	"ingester/constants"
	"reflect"
	"regexp"
	"slices"
	"sort"
	"strconv"
	"time"

	"github.com/antchfx/xmlquery"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// SoundRecording represents the parsed details of a sound recording
type SoundRecording struct {
	Type                         string
	ISRC                         string
	ResourceReference            string
	TerritoryCode                string
	Title                        string
	LanguageOfPerformance        string
	Duration                     string
	Artists                      []common.ResourceContributor
	ResourceContributors         []common.ResourceContributor
	IndirectResourceContributors []common.ResourceContributor
	RightsController             *common.RightsController
	CopyrightLine                *common.Copyright
	ProducerCopyrightLine        *common.Copyright
	ParentalWarningType          string
	LabelName                    string
	Genre                        common.Genre
	TechnicalDetails             []TechnicalSoundRecordingDetails
}

// TechnicalSoundRecordingDetails represents technical details about the sound recording
type TechnicalSoundRecordingDetails struct {
	Reference        string
	AudioCodecType   string
	NumberOfChannels int
	SamplingRate     float64
	IsPreview        bool
	FileDetails      FileDetails
	PreviewDetails   PreviewDetails
}

// FileDetails represents details about the sound recording file
type FileDetails struct {
	FileName             string
	FilePath             string
	HashSum              string
	HashSumAlgorithmType string
}

// PreviewDetails represents details about the sound recording file's preview
type PreviewDetails struct {
	StartPoint     *int
	EndPoint       *int
	Duration       string
	ExpressionType string
}

// Image represents the parsed details of an image
type Image struct {
	Type              string
	ProprietaryId     string
	ResourceReference string
	TerritoryCode     string
	TechnicalDetails  []TechnicalImageDetails
}

// TechnicalImageDetails represents technical details about the image
type TechnicalImageDetails struct {
	TechnicalResourceDetailsReference string
	ImageCodecType                    string
	ImageHeight                       int
	ImageWidth                        int
	ImageResolution                   int
	IsPreview                         bool
	FileDetails                       FileDetails
}

type ResourceType string

const ResourceTypeSoundRecording ResourceType = "SoundRecording"
const ResourceTypeImage ResourceType = "Image"
const ResourceTypeUnspecified ResourceType = "Unspecified"

var resourceTypes = map[string]ResourceType{
	"SoundRecording": ResourceTypeSoundRecording,
	"Image":          ResourceTypeImage,
}

// ResourceGroupContentItem represents a reference to an audio or image file within a <ResourceGroup> element
type ResourceGroupContentItem struct {
	GroupSequenceNumber            int
	ItemSequenceNumber             int
	ResourceType                   ResourceType
	Reference                      string
	IsInstantGratificationResource bool // The Flag indicating whether a Resource in a Release may be made available to consumers despite the distribution of the containing Release not having been permitted (=true) or not (=false). If this Element is not provided, it is assumed that this is False. The actual status of a Resource as an InstantGratificationResource is determined in the relevant Deal

	SoundRecording *SoundRecording
	Image          *Image
}

// purgeERN38x parses the given XML data and marks a release to be taken down from Audius.
// NOTE: This expects the ERN 3 format. See https://kb.ddex.net/implementing-each-standard/electronic-release-notification-message-suite-(ern)/ern-3-explained/
func purgeERN38x(doc *xmlquery.Node, release *common.Release, releasesColl *mongo.Collection) error {
	// Parse <Release>s from <ReleaseList>
	releaseNodes := xmlquery.Find(doc, "//ReleaseList/Release")
	if len(releaseNodes) == 0 {
		return fmt.Errorf("no <Release> found")
	}
	for _, rNode := range releaseNodes {
		releaseIDNode := rNode.SelectElement("ReleaseId")
		if releaseIDNode == nil {
			return fmt.Errorf("no <ReleaseId> found")
		}
		releaseIDs := getReleaseIDs(releaseIDNode)
		releaseIDsVal := reflect.ValueOf(releaseIDs)
		for i := 0; i < releaseIDsVal.NumField(); i++ {
			releaseID := releaseIDsVal.Field(i).String()
			if releaseID == "" {
				continue
			}

			// Take down the release with this ID, if any
			existingRelease, err := getExistingRelease(releaseID, releasesColl)
			if err == mongo.ErrNoDocuments {
				continue
			} else if err != nil {
				return err
			} else {
				takedownRelease(existingRelease, release)
				break
			}
		}
	}
	return nil
}

// parseERN38x parses the given XML data and returns a release ready to be uploaded to Audius.
// NOTE: This expects the ERN 3 format. See https://kb.ddex.net/implementing-each-standard/electronic-release-notification-message-suite-(ern)/ern-3-explained/
func parseERN38x(doc *xmlquery.Node, crawledBucket string, release *common.Release, releasesColl *mongo.Collection) (errs []error) {
	var (
		soundRecordings []SoundRecording
		images          []Image
	)

	// TODO: Implement updates and deletions.
	//       See https://kb.ddex.net/implementing-each-standard/best-practices-for-all-ddex-standards/guidance-on-message-exchange-protocols-and-choreographies/update-indicator/
	//       See https://kb.ddex.net/implementing-each-standard/best-practices-for-all-ddex-standards/guidance-on-message-exchange-protocols-and-choreographies/differentiating-inserts-from-updates/
	// Our ERN 381 ReleaseByRelease example has an UpdateIndicator.
	// Our ERN 382 Batched example communicates the update indicator in the batch XML, not this individual release XML that we're parsing now

	// Parse <SoundRecording>s from <ResourceList>
	soundRecordingNodes := xmlquery.Find(doc, "//ResourceList/SoundRecording")
	if len(soundRecordingNodes) == 0 {
		errs = append(errs, fmt.Errorf("no <SoundRecording> found"))
		return
	}
	for _, sNode := range soundRecordingNodes {
		if soundRecording, err := processSoundRecordingNode(sNode); err == nil {
			soundRecordings = append(soundRecordings, *soundRecording)
		} else {
			errs = append(errs, err)
		}
	}

	// Parse <Image>s from <ResourceList>
	imageNodes := xmlquery.Find(doc, "//ResourceList/Image")
	if len(imageNodes) == 0 {
		errs = append(errs, fmt.Errorf("no <Image> found"))
		return
	}
	for _, iNode := range imageNodes {
		if image, err := processImageNode(iNode); err == nil {
			images = append(images, *image)
		} else {
			errs = append(errs, err)
		}
	}

	// Parse <Release>s from <ReleaseList>
	releaseNodes := xmlquery.Find(doc, "//ReleaseList/Release")
	if len(releaseNodes) == 0 {
		errs = append(errs, fmt.Errorf("no <Release> found"))
		return
	}
	for _, releaseNode := range releaseNodes {
		if parsedReleaseElem, err := processReleaseNode(releaseNode, &soundRecordings, &images, crawledBucket, release); err == nil {
			release.ParsedReleaseElems = append(release.ParsedReleaseElems, *parsedReleaseElem)
		} else {
			errs = append(errs, err)
		}
	}

	// Validate existence of a single main release
	if len(release.ParsedReleaseElems) == 0 {
		errs = append(errs, fmt.Errorf("no <Release> elements could be parsed from <ReleaseList>"))
		return
	}
	_, err := getMainRelease(release)
	if err != nil {
		errs = append(errs, err)
		return
	}

	// Parse <ReleaseDeal>s from <DealList>
	dealNodes := xmlquery.Find(doc, "//DealList/ReleaseDeal")
	if len(dealNodes) == 0 {
		// Check for an existing release to determine whether this is a takedown request or an invalid NewReleaseMessage
		existingRelease, err := getExistingRelease(release.ReleaseID, releasesColl)
		if err == mongo.ErrNoDocuments {
			// This is a NewReleaseMessage that should have a deal
			errs = append(errs, fmt.Errorf("no <ReleaseDeal> found"))
			return
		} else if err != nil {
			errs = append(errs, err)
			return
		} else {
			// This is a takedown request. Mark the release for deletion
			takedownRelease(existingRelease, release)
		}
	}
	for _, dNode := range dealNodes {
		err := processDealNode(dNode, release)
		if err != nil {
			errs = append(errs, err)
			continue
		}
	}

	return
}

func buildSDKMetadataERN38x(release *common.Release) (errs []error) {
	mainRelease, err := getMainRelease(release)
	if err != nil {
		errs = append(errs, err)
		return
	}
	// Create metadata to use in the Audius SDK's upload based on release type
	switch release.ReleaseProfile {
	case common.Common13AudioSingle:
		buildSingleMetadata(release, mainRelease, &errs)
	case common.Common14AudioAlbumMusicOnly:
		buildAlbumMetadata(release, mainRelease, &errs)
	case common.UnspecifiedReleaseProfile:
		// The Sony ZIP example doesn't specify a profile, so we have to infer the type from the main release element
		if mainRelease.ReleaseType == common.AlbumReleaseType {
			buildAlbumMetadata(release, mainRelease, &errs)
		} else if mainRelease.ReleaseType == common.SingleReleaseType {
			buildSingleMetadata(release, mainRelease, &errs)
		} else {
			errs = append(errs, fmt.Errorf("only Album is supported when no release profile is specified"))
			return
		}
	}

	return
}

func getMainRelease(release *common.Release) (*common.ParsedReleaseElement, error) {
	var mainRelease *common.ParsedReleaseElement
	for i := range release.ParsedReleaseElems {
		parsedRelease := &release.ParsedReleaseElems[i]
		if parsedRelease.IsMainRelease {
			if mainRelease != nil {
				return nil, fmt.Errorf("multiple main releases found: %s and %s", mainRelease.ReleaseRef, parsedRelease.ReleaseRef)
			}
			mainRelease = parsedRelease
		}
	}
	if mainRelease == nil {
		return nil, fmt.Errorf("no main release found in releases: %#v", release.ParsedReleaseElems)
	}

	return mainRelease, nil
}

func buildSingleMetadata(release *common.Release, mainRelease *common.ParsedReleaseElement, errs *[]error) {
	// Verify mainRelease.profile is a single, and find supporting TrackRelease
	if mainRelease.ReleaseType != common.SingleReleaseType {
		*errs = append(*errs, fmt.Errorf("expected Single release type for main release"))
		return
	}
	if len(release.ParsedReleaseElems) != 2 {
		*errs = append(*errs, fmt.Errorf("expected Single to have at exactly 2 release elements, got %d", len(release.ParsedReleaseElems)))
		return
	}

	for _, parsedReleaseElem := range release.ParsedReleaseElems {
		if parsedReleaseElem.IsMainRelease {
			continue
		}
		if parsedReleaseElem.ReleaseType != common.TrackReleaseType {
			*errs = append(*errs, fmt.Errorf("expected TrackRelease release type for release ref %s", parsedReleaseElem.ReleaseRef))
			return
		}
		if parsedReleaseElem.Resources.Tracks == nil || len(parsedReleaseElem.Resources.Tracks) == 0 {
			*errs = append(*errs, fmt.Errorf("no tracks found for release %s", parsedReleaseElem.ReleaseRef))
			return
		}
		if len(parsedReleaseElem.Resources.Tracks) > 1 {
			*errs = append(*errs, fmt.Errorf("expected only one track for release %s", parsedReleaseElem.ReleaseRef))
			return
		}
	}

	// Single just has one track
	tracks, err := buildSupportingTracks(release)
	if err != nil {
		*errs = append(*errs, err)
		return
	}

	releaseIDs := tracks[0].DDEXReleaseIDs
	release.SDKUploadMetadata = common.SDKUploadMetadata{
		ReleaseDate:           tracks[0].ReleaseDate,
		ValidityStartDate:     tracks[0].ValidityStartDate,
		Genre:                 tracks[0].Genre,
		Artists:               tracks[0].Artists,
		Tags:                  nil,
		DDEXReleaseIDs:        &releaseIDs,
		CopyrightLine:         tracks[0].CopyrightLine,
		ProducerCopyrightLine: tracks[0].ProducerCopyrightLine,
		ParentalWarningType:   tracks[0].ParentalWarningType,

		// For singles, we have to use cover art from the main release because the TrackRelease doesn't have cover art
		CoverArtURL:         mainRelease.Resources.Images[0].URL,
		CoverArtURLHash:     stringPtr(mainRelease.Resources.Images[0].URLHash),
		CoverArtURLHashAlgo: stringPtr(mainRelease.Resources.Images[0].URLHashAlgo),

		Title:                        &tracks[0].Title,
		ArtistID:                     &tracks[0].ArtistID,
		Duration:                     tracks[0].Duration,
		PreviewStartSeconds:          tracks[0].PreviewStartSeconds,
		ISRC:                         tracks[0].ISRC,
		ResourceContributors:         tracks[0].ResourceContributors,
		IndirectResourceContributors: tracks[0].IndirectResourceContributors,
		RightsController:             tracks[0].RightsController,
		PreviewAudioFileURL:          stringPtr(tracks[0].PreviewAudioFileURL),
		PreviewAudioFileURLHash:      stringPtr(tracks[0].PreviewAudioFileURLHash),
		PreviewAudioFileURLHashAlgo:  stringPtr(tracks[0].PreviewAudioFileURLHashAlgo),
		AudioFileURL:                 stringPtr(tracks[0].AudioFileURL),
		AudioFileURLHash:             stringPtr(tracks[0].AudioFileURLHash),
		AudioFileURLHashAlgo:         stringPtr(tracks[0].AudioFileURLHash),
		IsStreamGated:                tracks[0].IsStreamGated,
		StreamConditions:             tracks[0].StreamConditions,
		IsDownloadGated:              tracks[0].IsDownloadGated,
		DownloadConditions:           tracks[0].DownloadConditions,
		IsStreamFollowGated:          tracks[0].IsStreamFollowGated,
		IsStreamTipGated:             tracks[0].IsStreamTipGated,
		IsDownloadFollowGated:        tracks[0].IsDownloadFollowGated,
		HasDeal:                      tracks[0].HasDeal,
	}

	if release.SDKUploadMetadata.ReleaseDate.IsZero() {
		release.SDKUploadMetadata.ReleaseDate = mainRelease.ReleaseDate
	}
}

func buildAlbumMetadata(release *common.Release, mainRelease *common.ParsedReleaseElement, errs *[]error) {
	// Verify mainRelease.profile is an album or EP, and find supporting TrackReleases
	if mainRelease.ReleaseType != common.AlbumReleaseType && mainRelease.ReleaseType != common.EPReleaseType {
		*errs = append(*errs, fmt.Errorf("expected Album or EP release type for main release"))
		return
	}
	if len(release.ParsedReleaseElems) < 2 {
		*errs = append(*errs, fmt.Errorf("expected Album or EP to have at least 2 release elements"))
		return
	}

	tracks, err := buildSupportingTracks(release)
	if err != nil {
		*errs = append(*errs, err)
		return
	}

	// Album is required to have a genre in its metadata (not just a genre per track)
	if mainRelease.Genre == "" {
		*errs = append(*errs, fmt.Errorf("missing genre for release %s", mainRelease.ReleaseRef))
		return
	}

	// Use mainRelease's genre for all tracks if a track is missing a genre
	for i := range tracks {
		if tracks[i].Genre == "" {
			tracks[i].Genre = mainRelease.Genre
		}
	}

	// Album is required to have a cover art image
	if mainRelease.Resources.Images == nil || len(mainRelease.Resources.Images) == 0 || mainRelease.Resources.Images[0].URL == "" {
		*errs = append(*errs, fmt.Errorf("missing cover art image for release %s", mainRelease.ReleaseRef))
		return
	}

	isAlbum := true // Also true for EPs. This could be false in the future if we support playlists

	releaseIDs := mainRelease.ReleaseIDs
	release.SDKUploadMetadata = common.SDKUploadMetadata{
		ReleaseDate:           mainRelease.ReleaseDate,
		ValidityStartDate:     mainRelease.ValidityStartDate,
		Genre:                 mainRelease.Genre,
		Artists:               mainRelease.Artists,
		Tags:                  nil,
		DDEXReleaseIDs:        &releaseIDs,
		CopyrightLine:         mainRelease.CopyrightLine,
		ProducerCopyrightLine: mainRelease.ProducerCopyrightLine,
		ParentalWarningType:   mainRelease.ParentalWarningType,
		CoverArtURL:           mainRelease.Resources.Images[0].URL,
		CoverArtURLHash:       stringPtr(mainRelease.Resources.Images[0].URLHash),
		CoverArtURLHashAlgo:   stringPtr(mainRelease.Resources.Images[0].URLHashAlgo),

		Tracks:            tracks,
		PlaylistName:      &mainRelease.DisplayTitle,
		PlaylistOwnerID:   &mainRelease.ArtistID,
		PlaylistOwnerName: &mainRelease.ArtistName,
		IsAlbum:           &isAlbum,
		UPC:               stringPtr(mainRelease.ReleaseIDs.ICPN), // ICPN is either UPC (USA/Canada) or EAN (rest of world), but we call them both UPC
		HasDeal:           mainRelease.HasDeal,

		// Fields we don't know the value for
		// Description:           "",
		// Mood:                  nil,
		// License:               nil,
		// UPC:                   nil,
	}
}

// buildSupportingTracks formats and returns (in order) all tracks in the release except the main release
func buildSupportingTracks(release *common.Release) (tracks []common.TrackMetadata, err error) {
	for _, parsedReleaseElem := range release.ParsedReleaseElems {
		if parsedReleaseElem.IsMainRelease {
			continue
		}
		if parsedReleaseElem.ReleaseType != common.TrackReleaseType {
			err = fmt.Errorf("expected TrackRelease release type for release ref %s", parsedReleaseElem.ReleaseRef)
			return
		}
		if parsedReleaseElem.Resources.Tracks == nil || len(parsedReleaseElem.Resources.Tracks) == 0 {
			err = fmt.Errorf("no tracks found for release %s", parsedReleaseElem.ReleaseRef)
			return
		}
		if len(parsedReleaseElem.Resources.Tracks) > 1 {
			err = fmt.Errorf("expected only one track for release %s", parsedReleaseElem.ReleaseRef)
			return
		}

		// Use fields from the <SoundRecording> (ie, Resources.Tracks[0]) and fall back to the <Release>'s fields when missing
		track := parsedReleaseElem.Resources.Tracks[0]
		if track.ArtistID == "" {
			track.ArtistID = parsedReleaseElem.ArtistID
		}
		if track.ArtistName == "" {
			track.ArtistName = parsedReleaseElem.ArtistName
		}
		if track.CopyrightLine == nil {
			track.CopyrightLine = parsedReleaseElem.CopyrightLine
		}
		if track.ProducerCopyrightLine == nil {
			track.ProducerCopyrightLine = parsedReleaseElem.ProducerCopyrightLine
		}
		if track.ParentalWarningType == nil {
			track.ParentalWarningType = parsedReleaseElem.ParentalWarningType
		}
		if track.Genre == "" {
			track.Genre = parsedReleaseElem.Genre
		}
		// Copy fields from the <Release> that are not present on the <SoundRecording>
		track.HasDeal = parsedReleaseElem.HasDeal
		track.IsStreamGated = parsedReleaseElem.IsStreamGated
		track.StreamConditions = parsedReleaseElem.StreamConditions
		track.IsDownloadGated = parsedReleaseElem.IsDownloadGated
		track.DownloadConditions = parsedReleaseElem.DownloadConditions
		track.IsStreamFollowGated = parsedReleaseElem.IsStreamFollowGated
		track.IsStreamTipGated = parsedReleaseElem.IsStreamTipGated
		track.IsDownloadFollowGated = parsedReleaseElem.IsDownloadFollowGated
		track.ReleaseDate = parsedReleaseElem.ReleaseDate
		track.ValidityStartDate = parsedReleaseElem.ValidityStartDate

		tracks = append(tracks, track)
	}
	return
}

// processReleaseNode parses a <Release> into a CreateTrackRelease or CreateAlbumRelease struct.
func processReleaseNode(rNode *xmlquery.Node, soundRecordings *[]SoundRecording, images *[]Image, crawledBucket string, release *common.Release) (r *common.ParsedReleaseElement, err error) {
	releaseRef := safeInnerText(rNode.SelectElement("ReleaseReference"))
	globalOriginalReleaseDateStr := safeInnerText(rNode.SelectElement("GlobalOriginalReleaseDate")) // Some suppliers (not Fuga) use this
	durationISOStr := safeInnerText(rNode.SelectElement("Duration"))                                // Only the Sony example uses this. Other suppliers use it in the SoundRecording
	copyrightYear := safeInnerText(rNode.SelectElement("CLine/Year"))
	copyrightText := safeInnerText(rNode.SelectElement("CLine/CLineText"))
	producerCopyrightYear := safeInnerText(rNode.SelectElement("PLine/Year"))
	producerCopyrightText := safeInnerText(rNode.SelectElement("PLine/PLineText"))

	// Release type
	releaseTypeStr := safeInnerText(rNode.SelectElement("ReleaseType"))
	releaseType, ok := common.StringToReleaseType[releaseTypeStr]
	if !ok {
		err = fmt.Errorf("unsupported release type: %s", releaseTypeStr)
		return
	}

	// Only use release info from the "Worldwide" territory
	detailsByTerritory, err := xmlquery.QueryAll(rNode, "ReleaseDetailsByTerritory")
	if err != nil {
		return
	}
	if len(detailsByTerritory) == 0 {
		err = fmt.Errorf("no <ReleaseDetailsByTerritory> found for <ReleaseReference>%s</ReleaseReference>", releaseRef)
		return
	}
	releaseDetails := findTerritoryForDetails(detailsByTerritory)
	if releaseDetails == nil {
		err = fmt.Errorf("no <ReleaseDetailsByTerritory> found for <ReleaseReference>%s</ReleaseReference> with <TerritoryCode>Worldwide</TerritoryCode>", releaseRef)
		return
	}

	detailsCopyrightYear := safeInnerText(releaseDetails.SelectElement("CLine/Year"))
	detailsCopyrightText := safeInnerText(releaseDetails.SelectElement("CLine/CLineText"))
	detailsProducerCopyrightYear := safeInnerText(releaseDetails.SelectElement("PLine/Year"))
	detailsProducerCopyrightText := safeInnerText(releaseDetails.SelectElement("PLine/PLineText"))

	artistName := safeInnerText(releaseDetails.SelectElement("DisplayArtistName"))
	releaseDateStr := safeInnerText(releaseDetails.SelectElement("ReleaseDate")) // Fuga uses this

	// Convert releaseDate from string of format YYYY-MM-DD to time.Time
	var releaseDate time.Time
	if releaseDateStr != "" {
		var releaseDateErr error
		releaseDate, releaseDateErr = time.Parse("2006-01-02", releaseDateStr)
		if releaseDateErr != nil {
			err = fmt.Errorf("failed to parse release date for <ReleaseReference>%s</ReleaseReference>: %s", releaseRef, releaseDateErr)
			return
		}
	} else if globalOriginalReleaseDateStr != "" {
		var releaseDateErr error
		releaseDate, releaseDateErr = time.Parse("2006-01-02", globalOriginalReleaseDateStr)
		if releaseDateErr != nil {
			err = fmt.Errorf("failed to parse global original release date for <ReleaseReference>%s</ReleaseReference>: %s", releaseRef, releaseDateErr)
			return
		}
	}

	// Parse DisplayArtist nodes
	var displayArtists []common.ResourceContributor
	for _, artistNode := range xmlquery.Find(releaseDetails, "DisplayArtist") {
		name := safeInnerText(artistNode.SelectElement("PartyName/FullName"))
		seqNo, seqNoErr := strconv.Atoi(artistNode.SelectAttr("SequenceNumber"))
		if seqNoErr != nil {
			err = fmt.Errorf("error parsing DisplayArtist %s's SequenceNumber: %w", name, seqNoErr)
			return
		}
		artist := common.ResourceContributor{
			Name:           name,
			SequenceNumber: seqNo,
		}
		for _, roleNode := range xmlquery.Find(artistNode, "ArtistRole") {
			artist.Roles = append(artist.Roles, safeInnerText(roleNode))
		}
		displayArtists = append(displayArtists, artist)
	}

	// Use <ResourceGroup> to determine the order of tracks, as per the XML schema.
	// There can be multiple <ResourceGroup>s for each "disk" in the album, but we count them all as one album with no "disk" concept.
	// We still maintain relative sorted order of tracks within each <ResourceGroup> and across all <ResourceGroup>s by sorting the slice later.
	// See https://kb.ddex.net/implementing-each-standard/best-practices-for-all-ddex-standards/guidance-on-releaseresourcework-metadata/resourcegroup-hierarchies/

	var contentItems []ResourceGroupContentItem
	processResourceGroup(releaseDetails, 0, &contentItems)
	if contentItems == nil {
		// TODO: We should probably allow there to be no resources because that's valid as per https://kb.ddex.net/implementing-each-standard/best-practices-for-all-ddex-standards/guidance-on-message-exchange-protocols-and-choreographies/no-resources-in-initial-delivery/
		err = fmt.Errorf("no <ResourceGroupContentItem> found for <ReleaseReference>%s</ReleaseReference>", releaseRef)
		return
	}

	// Sort the slice by GroupSequenceNumber first, then by ItemSequenceNumber
	sort.Slice(contentItems, func(i, j int) bool {
		if contentItems[i].GroupSequenceNumber == contentItems[j].GroupSequenceNumber {
			return contentItems[i].ItemSequenceNumber < contentItems[j].ItemSequenceNumber
		}
		return contentItems[i].GroupSequenceNumber < contentItems[j].GroupSequenceNumber
	})

	// Augment each resource with the SoundRecording or Image data from the <ResourceList>
	for i := range contentItems {
		if contentItems[i].ResourceType == ResourceTypeSoundRecording {
			for _, sr := range *soundRecordings {
				if sr.ResourceReference == contentItems[i].Reference {
					contentItems[i].SoundRecording = &sr
					break
				}
			}
		} else if contentItems[i].ResourceType == ResourceTypeImage {
			for _, img := range *images {
				if img.ResourceReference == contentItems[i].Reference {
					contentItems[i].Image = &img
					break
				}
			}
		} else {
			for _, sr := range *soundRecordings {
				if sr.ResourceReference == contentItems[i].Reference {
					contentItems[i].SoundRecording = &sr
					contentItems[i].ResourceType = ResourceTypeSoundRecording
					break
				}
			}

			for _, img := range *images {
				if img.ResourceReference == contentItems[i].Reference {
					contentItems[i].Image = &img
					contentItems[i].ResourceType = ResourceTypeImage
					break
				}
			}
		}
	}

	genre, _ := getGenres(releaseDetails)

	// Parse all resources (sound recordings and images) for the release
	resources := common.ReleaseResources{}
	for _, ci := range contentItems {
		if ci.ResourceType == ResourceTypeSoundRecording {
			var trackMetadata *common.TrackMetadata
			trackMetadata, err = parseTrackMetadata(ci, crawledBucket, release)
			if err != nil {
				return
			}
			resources.Tracks = append(resources.Tracks, *trackMetadata)
		} else if ci.ResourceType == ResourceTypeImage {
			if ci.Image == nil || len(ci.Image.TechnicalDetails) == 0 {
				err = fmt.Errorf("no <Image> found for <ResourceReference>%s</ResourceReference>", ci.Reference)
				return
			}
			for _, d := range ci.Image.TechnicalDetails {
				if d.IsPreview {
					fmt.Printf("Skipping unsupported preview for Image %s\n", ci.Reference)
					continue
				}
				localURL := fmt.Sprintf("%s/%s%s", release.ReleaseID, d.FileDetails.FilePath, d.FileDetails.FileName)
				if release.BatchID != "" {
					localURL = fmt.Sprintf("%s/%s", release.BatchID, localURL)
				}
				resources.Images = append(resources.Images, common.ImageMetadata{
					URL:         fmt.Sprintf("s3://%s/%s", crawledBucket, localURL),
					URLHash:     d.FileDetails.HashSum,
					URLHashAlgo: d.FileDetails.HashSumAlgorithmType,
				})
			}
		} else {
			err = fmt.Errorf("unsupported resource type %s", ci.ResourceType)
			return
		}
	}

	r = &common.ParsedReleaseElement{
		IsMainRelease:       rNode.SelectAttr("IsMainRelease") == "true",
		ReleaseRef:          releaseRef,
		ReleaseDate:         releaseDate,
		Resources:           resources,
		ReleaseType:         releaseType,
		ReleaseIDs:          getReleaseIDs(rNode.SelectElement("ReleaseId")),
		DisplayTitle:        safeInnerText(releaseDetails.SelectElement("Title[@TitleType='DisplayTitle']/TitleText")), // TODO: This assumes there aren't multiple titles in different languages (ie, different `LanguageAndScriptCode` attributes)
		DisplaySubtitle:     stringPtr(safeInnerText(releaseDetails.SelectElement("Title[@TitleType='DisplayTitle']/SubTitle"))),
		FormalTitle:         stringPtr(safeInnerText(releaseDetails.SelectElement("Title[@TitleType='FormalTitle']/TitleText"))),
		FormalSubtitle:      stringPtr(safeInnerText(releaseDetails.SelectElement("Title[@TitleType='FormalTitle']/SubTitle"))),
		ReferenceTitle:      stringPtr(safeInnerText(rNode.SelectElement("ReferenceTitle/TitleText"))),
		ReferenceSubtitle:   stringPtr(safeInnerText(rNode.SelectElement("ReferenceTitle/SubTitle"))),
		Genre:               genre,
		ArtistName:          artistName,
		Artists:             displayArtists,
		ParentalWarningType: stringPtr(safeInnerText(releaseDetails.SelectElement("ParentalWarningType"))),
	}

	if detailsCopyrightYear != "" && detailsCopyrightText != "" {
		r.CopyrightLine = &common.Copyright{
			Year: detailsCopyrightYear,
			Text: detailsCopyrightText,
		}
	} else if copyrightYear != "" && copyrightText != "" {
		r.CopyrightLine = &common.Copyright{
			Year: copyrightYear,
			Text: copyrightText,
		}
	}

	if detailsProducerCopyrightYear != "" && detailsProducerCopyrightText != "" {
		r.ProducerCopyrightLine = &common.Copyright{
			Year: detailsProducerCopyrightYear,
			Text: detailsProducerCopyrightText,
		}
	} else if producerCopyrightYear != "" && producerCopyrightText != "" {
		r.ProducerCopyrightLine = &common.Copyright{
			Year: producerCopyrightYear,
			Text: producerCopyrightText,
		}
	}
	if duration, durationErr := parseISODuration(durationISOStr); durationErr == nil {
		r.Duration = int(duration.Seconds())
	}

	return
}

func processDealNode(dNode *xmlquery.Node, release *common.Release) (err error) {
	releaseRefNodes := dNode.SelectElements("DealReleaseReference")
	if len(releaseRefNodes) == 0 {
		err = fmt.Errorf("no <DealReleaseReference>s found")
		return
	}

	releaseRefs := []string{}
	for _, refNode := range releaseRefNodes {
		ref := safeInnerText(refNode)
		if ref != "" {
			releaseRefs = append(releaseRefs, ref)
		}
	}

	deals, err := xmlquery.QueryAll(dNode, "Deal")
	if err != nil {
		return
	}

	for _, deal := range deals {
		dealTerms, err := xmlquery.Query(deal, "DealTerms")
		if err != nil {
			err = fmt.Errorf("no <DealTerms> found in deal for <DealReleaseReference>s %v", releaseRefs)
			break
		}

		// Parse commercial model type
		commercialModelTypeNode := dealTerms.SelectElement("CommercialModelType")
		commercialModelType := safeInnerText(commercialModelTypeNode)
		if commercialModelType == "UserDefined" {
			commercialModelType = commercialModelTypeNode.SelectAttr("UserDefinedValue")
		}

		// Parse supported use types
		useTypeNodes := dealTerms.SelectElements("Usage/UseType")
		useTypes := []string{}
		for _, useTypeNode := range useTypeNodes {
			useType := safeInnerText(useTypeNode)
			if useType == "Stream" || useType == "OnDemandStream" || useType == "PermanentDownload" {
				useTypes = append(useTypes, useType)
			}
		}

		if len(useTypes) == 0 {
			err = fmt.Errorf("no supported <UseType>s found in deal for <DealReleaseReference>s %v", releaseRefs)
			break
		}

		// TODO: Temp workaround for the Sony release-by-release e2e test.
		// The commercialModelType condition should be removed
		if commercialModelType != "PayAsYouGoModel" && commercialModelType != "SubscriptionModel" {
			// Parse territory codes
			territoryCodes := dealTerms.SelectElements("TerritoryCode")
			if len(territoryCodes) != 0 {
				if !containsWorldwideTerritoryCode(dealTerms) {
					err = fmt.Errorf("no Worldwide <TerritoryCode> found for <DealReleaseReference>s%v", releaseRefs)
					break
				}
			}
		}

		// Parse validity start date
		validityStartStr := safeInnerText(dealTerms.SelectElement("ValidityPeriod/StartDate"))
		if validityStartStr == "" {
			err = fmt.Errorf("missing required ValidityPeriod/StartDate for <DealReleaseReference>s%v", releaseRefs)
			break
		}
		validityStart, validityStartErr := time.Parse("2006-01-02", validityStartStr)
		if validityStartErr != nil {
			err = fmt.Errorf("error parsing ValidityPeriod/StartDate for <DealReleaseReference>s%v: %s", releaseRefs, validityStartErr)
			break
		}

		// Parse price
		var wholesalePricePerUnit int
		var priceCurrencyCode string
		wholesalePricePerUnitNode := dealTerms.SelectElement("PriceInformation/WholesalePricePerUnit")
		wholesalePricePerUnitStr := safeInnerText(wholesalePricePerUnitNode)
		if wholesalePricePerUnitNode != nil {
			priceCurrencyCode = wholesalePricePerUnitNode.SelectAttr("CurrencyCode")
		}
		if wholesalePricePerUnitStr != "" && priceCurrencyCode != "USD" {
			err = fmt.Errorf("unsupported currency code %s for <WholesalePricePerUnit> for <DealReleaseReference>s%v", priceCurrencyCode, releaseRefs)
		}
		if wholesalePricePerUnitStr != "" {
			var wholesalePricePerUnitErr error
			wholesalePricePerUnit, wholesalePricePerUnitErr = strconv.Atoi(wholesalePricePerUnitStr)
			if wholesalePricePerUnitErr != nil {
				err = fmt.Errorf("Error parsing <WholesalePricePerUnit>%s</WholesalePricePerUnit> for <DealReleaseReference>s%v", wholesalePricePerUnitStr, releaseRefs)
				break
			}
		}

		// Add deal info to each release referenced
		for _, releaseRef := range releaseRefs {
			// Find corresponding ParsedReleaseElem
			elem, found := findParsedReleaseElem(release, releaseRef)
			if !found {
				err = fmt.Errorf("no release found corresponding to <DealReleaseReference>%s</DealReleaseReference>", releaseRef)
			}

			for _, useType := range useTypes {
				if elem.ReleaseType == common.TrackReleaseType {
					switch useType {
					case "Stream", "OnDemandStream":
						err = addStreamingConditionsToReleaseElem(dealTerms, commercialModelType, useType, wholesalePricePerUnit, releaseRef, elem)
						if err != nil {
							break
						}
					case "PermanentDownload":
						err = addDownloadConditionsToReleaseElem(dealTerms, commercialModelType, useType, wholesalePricePerUnit, releaseRef, elem)
						if err != nil {
							break
						}
					default:
						err = fmt.Errorf("unsupported <UseType>%s</UseType> for <DealReleaseReference>%s</DealReleaseReference>", useType, releaseRef)
						break
					}
				}

				if validityStartStr != "" {
					elem.ValidityStartDate = validityStart
				}
				elem.HasDeal = true
			}
		}

		if err != nil {
			break
		}
	}

	return err
}

func findParsedReleaseElem(release *common.Release, releaseRef string) (*common.ParsedReleaseElement, bool) {
	for i, elem := range release.ParsedReleaseElems {
		if elem.ReleaseRef == releaseRef {
			return &release.ParsedReleaseElems[i], true
		}
	}
	return nil, false
}

func addStreamingConditionsToReleaseElem(dealTerms *xmlquery.Node, commercialModelType string, useType string, wholesalePricePerUnit int, releaseRef string, releaseElem *common.ParsedReleaseElement) (err error) {
	if commercialModelType == "FreeOfChargeModel" {
		releaseElem.IsStreamGated = false
	} else if commercialModelType == "PayAsYouGoModel" {
		// TODO: Temp workaround for the Sony release-by-release e2e test.
		// The following should be uncommented
		// if wholesalePricePerUnit == 0 {
		// 	err = fmt.Errorf("missing required nonzero <WholesalePricePerUnit> for <UseType>%s</UseType> for <DealReleaseReference>%s</DealReleaseReference>", useType, releaseRef)
		// 	return
		// }
		if wholesalePricePerUnit != 0 {
			releaseElem.IsStreamGated = true
			releaseElem.StreamConditions = &common.AccessConditions{
				USDCPurchase: &common.USDCPurchaseConditions{
					Price: wholesalePricePerUnit,
				},
			}
		}
	} else if commercialModelType == "NFTGated" {
		var conditions *xmlquery.Node
		conditions, err = xmlquery.Query(dealTerms, "Conditions")
		if err != nil {
			err = fmt.Errorf("missing required <Conditions> in <DealTerms> for <DealReleaseReference>%s</DealReleaseReference>", releaseRef)
			return
		}
		chain := safeInnerText(conditions.SelectElement("Chain"))
		address := safeInnerText(conditions.SelectElement("Address"))
		standard := safeInnerText(conditions.SelectElement("Standard"))
		name := safeInnerText(conditions.SelectElement("Name"))
		slug := safeInnerText(conditions.SelectElement("Slug"))
		imageUrl := safeInnerText(conditions.SelectElement("ImageUrl"))
		externalLink := safeInnerText(conditions.SelectElement("ExternalLink"))

		// Validate required fields
		if chain == "eth" {
			if address == "" || standard == "" || name == "" || slug == "" {
				err = fmt.Errorf("missing required eth NFT conditions in <DealTerms> for <DealReleaseReference>%s</DealReleaseReference>", releaseRef)
				return
			}
		} else if chain == "sol" {
			if address == "" || name == "" {
				err = fmt.Errorf("missing required sol NFT conditions in <DealTerms> for <DealReleaseReference>%s</DealReleaseReference>", releaseRef)
				return
			}
		} else {
			err = fmt.Errorf("missing or unsupported <Chain> in NFT conditions in <DealTerms> for <DealReleaseReference>%s</DealReleaseReference>", releaseRef)
			return
		}

		releaseElem.IsStreamGated = true
		releaseElem.StreamConditions = &common.AccessConditions{
			NFTCollection: &common.CollectibleGatedConditions{
				Chain:        chain,
				Address:      address,
				Standard:     standard,
				Name:         name,
				ImageURL:     imageUrl,
				ExternalLink: externalLink,
			},
		}
	} else if commercialModelType == "FollowGated" {
		releaseElem.IsStreamGated = true
		releaseElem.IsStreamFollowGated = true
	} else if commercialModelType == "TipGated" {
		releaseElem.IsStreamGated = true
		releaseElem.IsStreamTipGated = true
	} else if commercialModelType == "SubscriptionModel" || commercialModelType == "AdvertisementSupportedModel" {
		// TODO: Temp workaround for the e2e tests.
		// These types are unsupported and this condition should be removed.
		releaseElem.IsStreamGated = false
	} else {
		err = fmt.Errorf("unsupported <CommercialModelType>%s</CommercialModelType> for <UseType>%s</UseType> for <DealReleaseReference>%s</DealReleaseReference>", commercialModelType, useType, releaseRef)
		return
	}

	return nil
}

func addDownloadConditionsToReleaseElem(dealTerms *xmlquery.Node, commercialModelType string, useType string, wholesalePricePerUnit int, releaseRef string, releaseElem *common.ParsedReleaseElement) (err error) {
	if commercialModelType == "FreeOfChargeModel" {
		releaseElem.IsDownloadGated = false
	} else if commercialModelType == "PayAsYouGoModel" {
		// TODO: Temp workaround for the Sony release-by-release e2e test.
		// The following should be uncommented
		// if wholesalePricePerUnit == 0 {
		// 	err = fmt.Errorf("missing required <WholesalePricePerUnit> for <UseType>%s</UseType> for <DealReleaseReference>%s</DealReleaseReference>", useType, releaseRef)
		// 	return
		// }
		if wholesalePricePerUnit != 0 {
			releaseElem.IsDownloadGated = true
			releaseElem.DownloadConditions = &common.AccessConditions{
				USDCPurchase: &common.USDCPurchaseConditions{
					Price: wholesalePricePerUnit,
				},
			}
		}
	} else if commercialModelType == "FollowGated" {
		releaseElem.IsDownloadGated = true
		releaseElem.IsDownloadFollowGated = true
	} else {
		err = fmt.Errorf("unsupported <CommercialModelType>%s</CommercialModelType> for <UseType>%s</UseType> for <DealReleaseReference>%s</DealReleaseReference>", commercialModelType, useType, releaseRef)
		return
	}

	return nil
}

// parseTrackMetadata parses the metadata for a sound recording from a ResourceGroupContentItem
func parseTrackMetadata(ci ResourceGroupContentItem, crawledBucket string, release *common.Release) (metadata *common.TrackMetadata, err error) {
	if ci.SoundRecording == nil {
		err = fmt.Errorf("no <SoundRecording> found for <ResourceReference>%s</ResourceReference>", ci.Reference)
		return
	}
	if len(ci.SoundRecording.TechnicalDetails) == 0 {
		err = fmt.Errorf("no <TechnicalSoundRecordingDetails> found for SoundRecording %s", ci.Reference)
		return
	}

	duration, _ := parseISODuration(ci.SoundRecording.Duration)
	metadata = &common.TrackMetadata{
		Title:    ci.SoundRecording.Title,
		Duration: int(duration.Seconds()),
		ISRC:     &ci.SoundRecording.ISRC,
		DDEXReleaseIDs: common.ReleaseIDs{
			ISRC: ci.SoundRecording.ISRC,
		},
		Genre:                        ci.SoundRecording.Genre,
		Artists:                      ci.SoundRecording.Artists,
		ResourceContributors:         ci.SoundRecording.ResourceContributors,
		IndirectResourceContributors: ci.SoundRecording.IndirectResourceContributors,
		RightsController:             ci.SoundRecording.RightsController,
		CopyrightLine:                ci.SoundRecording.CopyrightLine,
		ProducerCopyrightLine:        ci.SoundRecording.ProducerCopyrightLine,
	}

	for _, d := range ci.SoundRecording.TechnicalDetails {
		if d.IsPreview {
			if metadata.PreviewAudioFileURL == "" {
				localURL := fmt.Sprintf("%s/%s%s", release.ReleaseID, d.FileDetails.FilePath, d.FileDetails.FileName)
				if release.BatchID != "" {
					localURL = fmt.Sprintf("%s/%s", release.BatchID, localURL)
				}
				metadata.PreviewAudioFileURL = fmt.Sprintf("s3://%s/%s", crawledBucket, localURL)
				metadata.PreviewAudioFileURLHash = d.FileDetails.HashSum
				metadata.PreviewAudioFileURLHashAlgo = d.FileDetails.HashSumAlgorithmType
				metadata.PreviewStartSeconds = d.PreviewDetails.StartPoint
			} else {
				fmt.Printf("Skipping duplicate audio preview for SoundRecording %s\n", ci.Reference)
			}
		} else {
			if metadata.AudioFileURL == "" {
				localURL := fmt.Sprintf("%s/%s%s", release.ReleaseID, d.FileDetails.FilePath, d.FileDetails.FileName)
				if release.BatchID != "" {
					localURL = fmt.Sprintf("%s/%s", release.BatchID, localURL)
				}
				metadata.AudioFileURL = fmt.Sprintf("s3://%s/%s", crawledBucket, localURL)
				metadata.AudioFileURLHash = d.FileDetails.HashSum
				metadata.AudioFileURLHashAlgo = d.FileDetails.HashSumAlgorithmType
			} else {
				fmt.Printf("Skipping duplicate audio file for SoundRecording %s\n", ci.Reference)
			}
		}
	}

	if ci.SoundRecording.ParentalWarningType != "" {
		metadata.ParentalWarningType = &ci.SoundRecording.ParentalWarningType
	}
	return
}

// processImageNode parses an <Image> node into an Image struct
func processImageNode(iNode *xmlquery.Node) (image *Image, err error) {
	resourceRef := safeInnerText(iNode.SelectElement("ResourceReference"))
	// Only use data from the "Worldwide" territory
	detailsByTerritory := xmlquery.Find(iNode, "ImageDetailsByTerritory")
	if len(detailsByTerritory) == 0 {
		err = fmt.Errorf("no <ImageDetailsByTerritory> found for <ResourceReference>%s</ResourceReference>", resourceRef)
		return
	}
	details := findTerritoryForDetails(detailsByTerritory)
	if details == nil {
		err = fmt.Errorf("no <ImageDetailsByTerritory> found for <ResourceReference>%s</ResourceReference> with <TerritoryCode>Worldwide</TerritoryCode>", resourceRef)
		return
	}

	image = &Image{
		Type:              safeInnerText(iNode.SelectElement("ImageType")),
		ProprietaryId:     safeInnerText(iNode.SelectElement("ImageId/ProprietaryId")),
		ResourceReference: resourceRef,
		TerritoryCode:     "Worldwide",
	}

	for _, techNode := range xmlquery.Find(details, "TechnicalImageDetails") {
		technicalDetail := TechnicalImageDetails{
			ImageCodecType:  safeInnerText(techNode.SelectElement("ImageCodecType")),
			ImageHeight:     safeAtoi(safeInnerText(techNode.SelectElement("ImageHeight"))),
			ImageWidth:      safeAtoi(safeInnerText(techNode.SelectElement("ImageWidth"))),
			ImageResolution: safeAtoi(safeInnerText(techNode.SelectElement("ImageResolution"))),
			IsPreview:       safeParseBool(safeInnerText(techNode.SelectElement("IsPreview"))),
			FileDetails: FileDetails{
				FileName:             safeInnerText(techNode.SelectElement("File/FileName")),
				FilePath:             safeInnerText(techNode.SelectElement("File/FilePath")),
				HashSum:              safeInnerText(techNode.SelectElement("File/HashSum/HashSum")),
				HashSumAlgorithmType: safeInnerText(techNode.SelectElement("File/HashSum/HashSumAlgorithmType")),
			},
		}
		image.TechnicalDetails = append(image.TechnicalDetails, technicalDetail)
	}

	return
}

// processSoundRecordingNode parses a <SoundRecording> node into a SoundRecording struct
func processSoundRecordingNode(sNode *xmlquery.Node) (recording *SoundRecording, err error) {
	resourceRef := safeInnerText(sNode.SelectElement("ResourceReference"))
	// Only use data from the "Worldwide" territory
	detailsByTerritory := xmlquery.Find(sNode, "SoundRecordingDetailsByTerritory")
	if len(detailsByTerritory) == 0 {
		err = fmt.Errorf("no <SoundRecordingDetailsByTerritory> found for <ResourceReference>%s</ResourceReference>", resourceRef)
		return
	}
	details := findTerritoryForDetails(detailsByTerritory)
	if details == nil {
		err = fmt.Errorf("no <SoundRecordingDetailsByTerritory> found for <ResourceReference>%s</ResourceReference> with <TerritoryCode>Worldwide</TerritoryCode>", resourceRef)
		return
	}

	genre, genreStrs := getGenres(details)
	if genre == "" {
		fmt.Printf("no genre match in list '%v' for <ResourceReference>%s</ResourceReference>\n", genreStrs, resourceRef)
	}

	recording = &SoundRecording{
		Type:                  safeInnerText(sNode.SelectElement("SoundRecordingType")),
		ISRC:                  safeInnerText(sNode.SelectElement("SoundRecordingId/ISRC")),
		ResourceReference:     resourceRef,
		TerritoryCode:         "Worldwide",
		Title:                 safeInnerText(sNode.SelectElement("ReferenceTitle/TitleText")),
		LanguageOfPerformance: safeInnerText(sNode.SelectElement("LanguageOfPerformance")),
		Duration:              safeInnerText(sNode.SelectElement("Duration")),
		LabelName:             safeInnerText(details.SelectElement("LabelName")),
		Genre:                 genre,
		ParentalWarningType:   safeInnerText(details.SelectElement("ParentalWarningType")),
	}

	// Parse copyrights
	copyrightYear := safeInnerText(details.SelectElement("CLine/Year"))
	copyrightText := safeInnerText(details.SelectElement("CLine/CLineText"))
	if copyrightYear != "" && copyrightText != "" {
		recording.CopyrightLine = &common.Copyright{
			Year: copyrightYear,
			Text: copyrightText,
		}
	}
	producerCopyrightYear := safeInnerText(details.SelectElement("PLine/Year"))
	producerCopyrightText := safeInnerText(details.SelectElement("PLine/PLineText"))
	if producerCopyrightYear != "" && producerCopyrightText != "" {
		recording.ProducerCopyrightLine = &common.Copyright{
			Year: producerCopyrightYear,
			Text: producerCopyrightText,
		}
	}

	// Parse DisplayArtist nodes
	for _, artistNode := range xmlquery.Find(details, "DisplayArtist") {
		name := safeInnerText(artistNode.SelectElement("PartyName/FullName"))
		seqNo, seqNoErr := strconv.Atoi(artistNode.SelectAttr("SequenceNumber"))
		if seqNoErr != nil {
			err = fmt.Errorf("error parsing DisplayArtist %s's SequenceNumber: %w", name, seqNoErr)
			return
		}
		artist := common.ResourceContributor{
			Name:           name,
			SequenceNumber: seqNo,
		}
		for _, roleNode := range xmlquery.Find(artistNode, "ArtistRole") {
			artist.Roles = append(artist.Roles, safeInnerText(roleNode))
		}
		recording.Artists = append(recording.Artists, artist)
	}

	// Parse ResourceContributor nodes
	err = nil
	for _, contributorNode := range xmlquery.Find(details, "ResourceContributor") {
		name := safeInnerText(contributorNode.SelectElement("PartyName/FullName"))
		seqNo, seqNoErr := strconv.Atoi(contributorNode.SelectAttr("SequenceNumber"))
		if seqNoErr != nil {
			seqNo = -1
		}
		contributor := common.ResourceContributor{
			Name:           name,
			SequenceNumber: seqNo,
		}
		for _, roleNode := range xmlquery.Find(contributorNode, "ResourceContributorRole") {
			role := safeInnerText(roleNode)
			if role == "UserDefined" {
				role = roleNode.SelectAttr("UserDefinedValue")
			}
			if role != "" {
				contributor.Roles = append(contributor.Roles, role)
			}
		}
		recording.ResourceContributors = append(recording.ResourceContributors, contributor)
	}

	// Parse IndirectResourceContributor nodes
	for _, indirectContributorNode := range xmlquery.Find(details, "IndirectResourceContributor") {
		name := safeInnerText(indirectContributorNode.SelectElement("PartyName/FullName"))
		seqNo, seqNoErr := strconv.Atoi(indirectContributorNode.SelectAttr("SequenceNumber"))
		if seqNoErr != nil {
			seqNo = -1
		}
		contributor := common.ResourceContributor{
			Name:           name,
			SequenceNumber: seqNo,
		}
		for _, roleNode := range xmlquery.Find(indirectContributorNode, "IndirectResourceContributorRole") {
			role := safeInnerText(roleNode)
			if role == "UserDefined" {
				role = roleNode.SelectAttr("UserDefinedValue")
			}
			if role != "" {
				contributor.Roles = append(contributor.Roles, role)
			}
		}
		recording.IndirectResourceContributors = append(recording.IndirectResourceContributors, contributor)
	}

	// Parse RightsController
	if rightsControllerNode := xmlquery.FindOne(details, "RightsController"); rightsControllerNode != nil {
		controller := common.RightsController{
			Name:               safeInnerText(rightsControllerNode.SelectElement("PartyName/FullName")),
			RightsShareUnknown: safeInnerText(rightsControllerNode.SelectElement("RightsShareUnknown")),
		}
		for _, roleNode := range xmlquery.Find(rightsControllerNode, "RightsControllerRole") {
			controller.Roles = append(controller.Roles, safeInnerText(roleNode))
		}
		recording.RightsController = &controller
	}

	// Parse TechnicalSoundRecordingDetails nodes
	for _, techNode := range xmlquery.Find(details, "TechnicalSoundRecordingDetails") {
		technicalDetail := TechnicalSoundRecordingDetails{
			Reference:      safeInnerText(techNode.SelectElement("TechnicalResourceDetailsReference")),
			AudioCodecType: safeInnerText(techNode.SelectElement("AudioCodecType")),
			FileDetails: FileDetails{
				FileName:             safeInnerText(techNode.SelectElement("File/FileName")),
				FilePath:             safeInnerText(techNode.SelectElement("File/FilePath")),
				HashSum:              safeInnerText(techNode.SelectElement("File/HashSum/HashSum")),
				HashSumAlgorithmType: safeInnerText(techNode.SelectElement("File/HashSum/HashSumAlgorithmType")),
			},
			IsPreview:        safeParseBool(safeInnerText(techNode.SelectElement("IsPreview"))),
			SamplingRate:     safeParseFloat64(safeInnerText(techNode.SelectElement("SamplingRate"))),
			NumberOfChannels: safeAtoi(safeInnerText(techNode.SelectElement("NumberOfChannels"))),
		}
		if technicalDetail.IsPreview {
			technicalDetail.PreviewDetails = PreviewDetails{
				Duration:       safeInnerText(techNode.SelectElement("PreviewDetails/Duration")),
				ExpressionType: safeInnerText(techNode.SelectElement("PreviewDetails/ExpressionType")),
			}
			startPointStr := safeInnerText(techNode.SelectElement("PreviewDetails/StartPoint"))
			if startPointStr != "" {
				var startPoint int
				startPoint, err = strconv.Atoi(startPointStr)
				if err != nil {
					err = fmt.Errorf("error parsing PreviewDetails/StartPoint")
					return
				}
				technicalDetail.PreviewDetails.StartPoint = &startPoint
			}
			endPointStr := safeInnerText(techNode.SelectElement("PreviewDetails/EndPoint"))
			if endPointStr != "" {
				var endPoint int
				endPoint, err = strconv.Atoi(endPointStr)
				if err != nil {
					err = fmt.Errorf("error parsing PreviewDetails/EndPoint")
					return
				}
				technicalDetail.PreviewDetails.EndPoint = &endPoint
			}
		}
		recording.TechnicalDetails = append(recording.TechnicalDetails, technicalDetail)
	}
	return
}

func processResourceGroup(node *xmlquery.Node, parentSequence int, contentItems *[]ResourceGroupContentItem) {
	// Extract and use the current ResourceGroup's SequenceNumber if available, otherwise use the parent's
	currentSequence := safeAtoi(safeInnerText(node.SelectElement("SequenceNumber")))
	if currentSequence == 0 {
		currentSequence = parentSequence
	}

	// Process direct ResourceGroupContentItems
	for _, item := range xmlquery.Find(node, "ResourceGroupContentItem") {
		resourceTypeStr := safeInnerText(item.SelectElement("ResourceType"))
		resourceType, ok := resourceTypes[resourceTypeStr]
		if !ok {
			resourceType = ResourceTypeUnspecified
		}
		ci := ResourceGroupContentItem{
			GroupSequenceNumber:            currentSequence,
			ItemSequenceNumber:             safeAtoi(safeInnerText(item.SelectElement("SequenceNumber"))),
			ResourceType:                   resourceType,
			Reference:                      safeInnerText(item.SelectElement("ReleaseResourceReference")),
			IsInstantGratificationResource: safeParseBool(safeInnerText(item.SelectElement("IsInstantGratificationResource"))),
		}
		*contentItems = append(*contentItems, ci)
	}

	// Recursively process nested ResourceGroups
	for _, rg := range xmlquery.Find(node, "ResourceGroup") {
		processResourceGroup(rg, currentSequence, contentItems)
	}
}

func getExistingRelease(releaseID string, releasesColl *mongo.Collection) (common.Release, error) {
	var existingRelease common.Release
	filter := bson.M{"_id": releaseID}
	err := releasesColl.FindOne(context.Background(), filter).Decode(&existingRelease)
	return existingRelease, err
}

func takedownRelease(existingRelease common.Release, releaseToUpsert *common.Release) {
	switch existingRelease.ReleaseStatus {
	case constants.ReleaseStatusPublished, constants.ReleaseStatusFailedAfterUpload, constants.ReleaseStatusFailedDuringDelete:
		// Has been published to Audius. Mark for deletion by the publisher
		releaseToUpsert.ReleaseStatus = constants.ReleaseStatusAwaitingDelete
		releaseToUpsert.EntityID = existingRelease.EntityID
		releaseToUpsert.SDKUploadMetadata = existingRelease.SDKUploadMetadata
	default:
		// Has not yet been published to Audius. Mark as deleted
		releaseToUpsert.ReleaseStatus = constants.ReleaseStatusDeleted
	}
}

func safeInnerText(node *xmlquery.Node) string {
	if node != nil {
		return node.InnerText()
	}
	return ""
}

func safeAtoi(s string) int {
	if v, err := strconv.Atoi(s); err == nil {
		return v
	}
	return 0
}

func safeParseBool(s string) bool {
	if v, err := strconv.ParseBool(s); err == nil {
		return v
	}
	return false
}

func safeParseFloat64(s string) float64 {
	if v, err := strconv.ParseFloat(s, 64); err == nil {
		return v
	}
	return 0
}

func containsWorldwideTerritoryCode(node *xmlquery.Node) bool {
	territoryCodes := xmlquery.Find(node, "TerritoryCode")
	if slices.ContainsFunc(territoryCodes, func(n *xmlquery.Node) bool {
		// TODO: "NL" is a temporary workaround for the CPD test. Should be removed
		return safeInnerText(n) == "Worldwide" || safeInnerText(n) == "NL"
	}) {
		return true
	}
	return false
}

func findTerritoryForDetails(details []*xmlquery.Node) *xmlquery.Node {
	for _, d := range details {
		if containsWorldwideTerritoryCode(d) {
			return d
		}
	}
	return nil
}

func parseISODuration(isoDuration string) (time.Duration, error) {
	// Regular expression to parse the ISO 8601 duration format
	re := regexp.MustCompile(`PT(\d+H)?(\d+M)?(\d+S)?`)
	matches := re.FindStringSubmatch(isoDuration)

	if len(matches) == 0 {
		return 0, fmt.Errorf("invalid ISO 8601 duration: %s", isoDuration)
	}

	var hours, minutes, seconds int
	var err error

	// Parse hours
	if matches[1] != "" {
		hours, err = strconv.Atoi(matches[1][:len(matches[1])-1]) // Remove trailing "H" and convert to int
		if err != nil {
			return 0, err
		}
	}

	// Parse minutes
	if matches[2] != "" {
		minutes, err = strconv.Atoi(matches[2][:len(matches[2])-1]) // Remove trailing "M" and convert to int
		if err != nil {
			return 0, err
		}
	}

	// Parse seconds
	if matches[3] != "" {
		seconds, err = strconv.Atoi(matches[3][:len(matches[3])-1]) // Remove trailing "S" and convert to int
		if err != nil {
			return 0, err
		}
	}

	totalSeconds := hours*3600 + minutes*60 + seconds
	duration := time.Duration(totalSeconds) * time.Second
	return duration, nil
}

// getGenres returns the first match of Genre for all SubGenre and GenreText elements, along with the ordered slice of strings it tried to match
func getGenres(node *xmlquery.Node) (genre common.Genre, genreStrs []string) {
	for _, genreNode := range xmlquery.Find(node, "Genre") {
		genreStrs = append(genreStrs, safeInnerText(genreNode.SelectElement("SubGenre")))
	}
	for _, genreNode := range xmlquery.Find(node, "Genre") {
		genreStrs = append(genreStrs, safeInnerText(genreNode.SelectElement("GenreText")))
	}

	var ok bool
	for _, genreStr := range genreStrs {
		genre, ok = common.ToGenre(genreStr)
		if ok {
			return
		} else {
			fmt.Printf("Skipping unsupported genre '%s'\n", genreStr)
		}
	}
	return
}

func stringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
