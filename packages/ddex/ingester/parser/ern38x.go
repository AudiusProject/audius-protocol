package parser

import (
	"fmt"
	"ingester/common"
	"regexp"
	"slices"
	"sort"
	"strconv"
	"time"

	"github.com/antchfx/xmlquery"
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
	StartPoint     int
	EndPoint       int
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

// parseERN38x parses the given XML data and returns a release ready to be uploaded to Audius.
// NOTE: This expects the ERN 3 format. See https://kb.ddex.net/implementing-each-standard/electronic-release-notification-message-suite-(ern)/ern-3-explained/
func parseERN38x(doc *xmlquery.Node, crawledBucket, releaseID string, release *common.Release) (errs []error) {
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
		if parsedReleaseElem, err := processReleaseNode(releaseNode, &soundRecordings, &images, crawledBucket, releaseID); err == nil {
			release.ParsedReleaseElems = append(release.ParsedReleaseElems, *parsedReleaseElem)
		} else {
			errs = append(errs, err)
		}
	}

	// Find the release that's marked as the main release
	if len(release.ParsedReleaseElems) == 0 {
		errs = append(errs, fmt.Errorf("no <Release> elements could be parsed from <ReleaseList>"))
		return
	}
	var mainRelease *common.ParsedReleaseElement
	for i := range release.ParsedReleaseElems {
		parsedRelease := &release.ParsedReleaseElems[i]
		if parsedRelease.IsMainRelease {
			if mainRelease != nil {
				errs = append(errs, fmt.Errorf("multiple main releases found: %s and %s", mainRelease.ReleaseRef, parsedRelease.ReleaseRef))
				return
			}
			mainRelease = parsedRelease
			release.PublishDate = parsedRelease.ReleaseDate
		}
	}
	if mainRelease == nil {
		errs = append(errs, fmt.Errorf("no main release found in releases: %#v", release.ParsedReleaseElems))
		return
	}

	// Create metadata to use in the Audius SDK's upload based on release type
	switch release.ReleaseProfile {
	case common.Common13AudioSingle:
		// Verify mainRelease.profile is a single, and find supporting TrackRelease
		if mainRelease.ReleaseType != common.SingleReleaseType {
			errs = append(errs, fmt.Errorf("expected Single release type for main release"))
			return
		}
		if len(release.ParsedReleaseElems) < 2 {
			errs = append(errs, fmt.Errorf("expected Single to have at least 2 release elements"))
			return
		}
		// TODO: Set release.SDKUploadMetadata for a Single (just use the TrackRelease and ignore the main release which would normally appear as an album with 1 track if Audius supported Singles)
		/**
		if track.Title == "" {
				if parsedReleaseElem.DisplayTitle == "" {
					errs = append(errs, fmt.Errorf("missing title for release %s", parsedReleaseElem.ReleaseRef))
					return
				}
				track.Title = parsedReleaseElem.DisplayTitle
			}

			if track.ISRC == nil || *track.ISRC == "" {
				if *parsedReleaseElem.ISRC == "" {
					errs = append(errs, fmt.Errorf("missing isrc for %s", parsedReleaseElem.ReleaseRef))
					return
				}
				track.ISRC = parsedReleaseElem.ISRC
			} else {
				if *track.ISRC != *parsedReleaseElem.ISRC {
					// Use the ISRC from the SoundRecording if it differs from the Release ISRC
					track.DDEXReleaseIDs.ISRC = *parsedReleaseElem.ISRC
				}
			}

			// Track could have a genre in its SoundRecording. If not, fall back to the genre in its Release element
			if track.Genre == "" {
				if parsedReleaseElem.Genre == "" {
					errs = append(errs, fmt.Errorf("no genre match for", parsedReleaseElem.ReleaseRef))
					return
				}
				track.Genre = parsedReleaseElem.Genre
			}
		*/
	case common.Common14AudioAlbumMusicOnly:
		// Verify mainRelease.profile is an album or EP, and find supporting TrackReleases
		if mainRelease.ReleaseType != common.AlbumReleaseType && mainRelease.ReleaseType != common.EPReleaseType {
			errs = append(errs, fmt.Errorf("expected Album or EP release type for main release"))
			return
		}
		if len(release.ParsedReleaseElems) < 2 {
			errs = append(errs, fmt.Errorf("expected Album or EP to have at least 2 release elements"))
			return
		}

		// Build slice of TrackMetadata from each TrackRelease in this album
		tracks := make([]common.TrackMetadata, 0)
		for _, parsedReleaseElem := range release.ParsedReleaseElems {
			if parsedReleaseElem.IsMainRelease {
				continue
			}
			if parsedReleaseElem.ReleaseType != common.TrackReleaseType {
				errs = append(errs, fmt.Errorf("expected TrackRelease release type for release ref %s", parsedReleaseElem.ReleaseRef))
				return
			}
			if parsedReleaseElem.Resources.Tracks == nil || len(parsedReleaseElem.Resources.Tracks) == 0 {
				errs = append(errs, fmt.Errorf("no tracks found for release %s", parsedReleaseElem.ReleaseRef))
				return
			}
			if len(parsedReleaseElem.Resources.Tracks) > 1 {
				errs = append(errs, fmt.Errorf("expected only one track for release %s", parsedReleaseElem.ReleaseRef))
				return
			}

			track := parsedReleaseElem.Resources.Tracks[0]
			track.DDEXReleaseIDs = mainRelease.ReleaseIDs
			if track.ArtistID == "" {
				track.ArtistID = parsedReleaseElem.ArtistID
			}
			if track.ArtistName == "" {
				track.ArtistName = parsedReleaseElem.ArtistName
			}
			if track.CopyrightLine == nil {
				track.CopyrightLine = parsedReleaseElem.CopyrightLine
			}

			tracks = append(tracks, track)
		}

		// Album is required to have a genre in its metadata (not just a genre per track)
		if mainRelease.Genre == "" {
			errs = append(errs, fmt.Errorf("missing genre for release %s", mainRelease.ReleaseRef))
			return
		}

		// Album is required to have a cover art image
		if mainRelease.Resources.Images == nil || len(mainRelease.Resources.Images) == 0 || mainRelease.Resources.Images[0].URL == "" {
			errs = append(errs, fmt.Errorf("missing cover art image for release %s", mainRelease.ReleaseRef))
			return
		}

		isAlbum := true // Also true for EPs. This could be false in the future if we support playlists

		releaseIDs := mainRelease.ReleaseIDs
		release.SDKUploadMetadata = common.SDKUploadMetadata{
			ReleaseDate:           mainRelease.ReleaseDate,
			Genre:                 mainRelease.Genre,
			Artists:               mainRelease.Artists,
			Tags:                  nil,
			DDEXReleaseIDs:        &releaseIDs,
			CopyrightLine:         mainRelease.CopyrightLine,
			ProducerCopyrightLine: mainRelease.CopyrightLine,
			ParentalWarningType:   mainRelease.ParentalWarningType,
			CoverArtURL:           mainRelease.Resources.Images[0].URL,
			CoverArtURLHash:       &mainRelease.Resources.Images[0].URLHash,
			CoverArtURLHashAlgo:   &mainRelease.Resources.Images[0].URLHashAlgo,

			Tracks:            tracks,
			PlaylistName:      &mainRelease.DisplayTitle,
			PlaylistOwnerID:   &mainRelease.ArtistID,
			PlaylistOwnerName: &mainRelease.ArtistName,
			IsAlbum:           &isAlbum,

			// Fields we don't know the value for (except IsPrivate should come from parsing DealList)
			// Description:           "",
			// Mood:                  nil,
			// License:               nil,
			// IsPrivate:         nil,
			// UPC:               nil,
		}

	case common.UnspecifiedReleaseProfile:
		// TODO: Allow this to work for the Sony example, which doesn't specify a profile
		errs = append(errs, fmt.Errorf("unsupported release profile: %s", release.ReleaseProfile))
	}

	return
}

// processReleaseNode parses a <Release> into a CreateTrackRelease or CreateAlbumRelease struct.
func processReleaseNode(rNode *xmlquery.Node, soundRecordings *[]SoundRecording, images *[]Image, crawledBucket, releaseID string) (r *common.ParsedReleaseElement, err error) {
	releaseRef := safeInnerText(rNode.SelectElement("ReleaseReference"))
	globalOriginalReleaseDateStr := safeInnerText(rNode.SelectElement("GlobalOriginalReleaseDate")) // Some suppliers (not Fuga) use this. TODO: This is deprecated. Need to use DealList
	durationISOStr := safeInnerText(rNode.SelectElement("Duration"))                                // Only the Sony example uses this. Other suppliers use it in the SoundRecording
	isrc := safeInnerText(rNode.SelectElement("ReleaseId/ISRC"))
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

	artistName := safeInnerText(releaseDetails.SelectElement("DisplayArtistName"))
	releaseDateStr := safeInnerText(releaseDetails.SelectElement("ReleaseDate")) // Fuga uses this. TODO: Still need to use DealList

	// Convert releaseDate from string of format YYYY-MM-DD to time.Time
	var releaseDate time.Time
	var releaseDateErr error
	if releaseDateStr != "" {
		releaseDate, releaseDateErr = time.Parse("2006-01-02", releaseDateStr)
		if releaseDateErr != nil {
			err = fmt.Errorf("failed to parse release date for <ReleaseReference>%s</ReleaseReference>: %s", releaseRef, releaseDateErr)
			return
		}
	} else if globalOriginalReleaseDateStr != "" {
		releaseDate, releaseDateErr = time.Parse("2006-01-02", globalOriginalReleaseDateStr)
		if releaseDateErr != nil {
			err = fmt.Errorf("failed to parse global original release date for <ReleaseReference>%s</ReleaseReference>: %s", releaseRef, releaseDateErr)
			return
		}
	} else {
		err = fmt.Errorf("missing release date for <ReleaseReference>%s</ReleaseReference>", releaseRef)
		return
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
		}
	}

	genre, _ := getGenres(releaseDetails)

	// Parse all resources (sound recordings and images) for the release
	resources := common.ReleaseResources{}
	for _, ci := range contentItems {
		if ci.ResourceType == ResourceTypeSoundRecording {
			var trackMetadata *common.TrackMetadata
			trackMetadata, err = parseTrackMetadata(ci, crawledBucket, releaseID)
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
				resources.Images = append(resources.Images, common.ImageMetadata{
					URL:         fmt.Sprintf("s3://%s/%s/%s%s", crawledBucket, releaseID, d.FileDetails.FilePath, d.FileDetails.FileName),
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
		IsMainRelease: rNode.SelectAttr("IsMainRelease") == "true",
		ReleaseRef:    releaseRef,
		ReleaseDate:   releaseDate,
		Resources:     resources,
		ReleaseType:   releaseType,
		ReleaseIDs: common.ReleaseIDs{
			PartyID:       safeInnerText(rNode.SelectElement("ReleaseId/PartyId")),
			CatalogNumber: safeInnerText(rNode.SelectElement("ReleaseId/CatalogNumber")),
			ICPN:          safeInnerText(rNode.SelectElement("ReleaseId/ICPN")),
			GRid:          safeInnerText(rNode.SelectElement("ReleaseId/GRid")),
			ISAN:          safeInnerText(rNode.SelectElement("ReleaseId/ISAN")),
			ISBN:          safeInnerText(rNode.SelectElement("ReleaseId/ISBN")),
			ISMN:          safeInnerText(rNode.SelectElement("ReleaseId/ISMN")),
			ISRC:          isrc,
			ISSN:          safeInnerText(rNode.SelectElement("ReleaseId/ISSN")),
			ISTC:          safeInnerText(rNode.SelectElement("ReleaseId/ISTC")),
			ISWC:          safeInnerText(rNode.SelectElement("ReleaseId/ISWC")),
			MWLI:          safeInnerText(rNode.SelectElement("ReleaseId/MWLI")),
			SICI:          safeInnerText(rNode.SelectElement("ReleaseId/SICI")),
			ProprietaryID: safeInnerText(rNode.SelectElement("ReleaseId/ProprietaryId")),
		},

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

	if copyrightYear != "" && copyrightText != "" {
		r.CopyrightLine = &common.Copyright{
			Year: copyrightYear,
			Text: copyrightText,
		}
	}
	if producerCopyrightYear != "" && producerCopyrightText != "" {
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

// parseTrackMetadata parses the metadata for a sound recording from a ResourceGroupContentItem
func parseTrackMetadata(ci ResourceGroupContentItem, crawledBucket, releaseID string) (metadata *common.TrackMetadata, err error) {
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
		Title:                        ci.SoundRecording.Title,
		Duration:                     int(duration.Seconds()),
		ISRC:                         &ci.SoundRecording.ISRC,
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
				metadata.PreviewAudioFileURL = fmt.Sprintf("s3://%s/%s/%s%s", crawledBucket, releaseID, d.FileDetails.FilePath, d.FileDetails.FileName)
				metadata.PreviewAudioFileURLHash = d.FileDetails.HashSum
				metadata.PreviewAudioFileURLHashAlgo = d.FileDetails.HashSumAlgorithmType
				metadata.PreviewStartSeconds = &d.PreviewDetails.StartPoint
			} else {
				fmt.Printf("Skipping duplicate audio preview for SoundRecording %s\n", ci.Reference)
			}
		} else {
			if metadata.AudioFileURL == "" {
				metadata.AudioFileURL = fmt.Sprintf("s3://%s/%s/%s%s", crawledBucket, releaseID, d.FileDetails.FilePath, d.FileDetails.FileName)
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
			fmt.Printf("error parsing ResourceContributor %s's SequenceNumber: %v\n", name, seqNoErr)
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
			fmt.Printf("error parsing IndirectResourceContributor %s's SequenceNumber: %v\n", name, seqNoErr)
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
				StartPoint:     safeAtoi(safeInnerText(techNode.SelectElement("PreviewDetails/StartPoint"))),
				EndPoint:       safeAtoi(safeInnerText(techNode.SelectElement("PreviewDetails/EndPoint"))),
				Duration:       safeInnerText(techNode.SelectElement("PreviewDetails/Duration")),
				ExpressionType: safeInnerText(techNode.SelectElement("PreviewDetails/ExpressionType")),
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
			fmt.Printf("Skipping unsupported resource type %s\n", resourceTypeStr)
			continue
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

func findTerritoryForDetails(details []*xmlquery.Node) *xmlquery.Node {
	for _, d := range details {
		territoryCodes := xmlquery.Find(d, "TerritoryCode")
		if slices.ContainsFunc(territoryCodes, func(n *xmlquery.Node) bool {
			// TODO: "NL" is a temporary workaround for the CPD test. Should be removed
			return safeInnerText(n) == "Worldwide" || safeInnerText(n) == "NL"
		}) {
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
