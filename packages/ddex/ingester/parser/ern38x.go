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

// SoundRecording represents the parsed details of a sound recording.
type SoundRecording struct {
	Type                  string
	ISRC                  string
	ResourceReference     string
	TerritoryCode         string
	Title                 string
	LanguageOfPerformance string
	Duration              string
	Artists               []common.Artist
	ResourceContributors  []ResourceContributor
	LabelName             string
	Genre                 string
	ParentalWarningType   string
	TechnicalDetails      []TechnicalSoundRecordingDetails
}

// ResourceContributor represents a contributor to the sound recording.
type ResourceContributor struct {
	Name  string
	Roles []string
}

// TechnicalSoundRecordingDetails represents technical details about the sound recording.
type TechnicalSoundRecordingDetails struct {
	Reference        string
	AudioCodecType   string
	NumberOfChannels int
	SamplingRate     float64
	IsPreview        bool
	FileDetails      FileDetails
	PreviewDetails   PreviewDetails
}

// FileDetails represents details about the sound recording file.
type FileDetails struct {
	FileName             string
	FilePath             string
	HashSum              string
	HashSumAlgorithmType string
}

// PreviewDetails represents details about the sound recording file's preview.
type PreviewDetails struct {
	StartPoint     int
	EndPoint       int
	Duration       string
	ExpressionType string
}

// Image represents the parsed details of an image.
type Image struct {
	Type              string
	ProprietaryId     string
	ResourceReference string
	TerritoryCode     string
	TechnicalDetails  []TechnicalImageDetails
}

// TechnicalImageDetails represents technical details about the image.
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

// ResourceGroupContentItem represents a reference to an audio or image file within a <ResourceGroup> element.
type ResourceGroupContentItem struct {
	GroupSequenceNumber            int
	ItemSequenceNumber             int
	ResourceType                   ResourceType
	Reference                      string
	IsInstantGratificationResource bool // The Flag indicating whether a Resource in a Release may be made available to consumers despite the distribution of the containing Release not having been permitted (=true) or not (=false). If this Element is not provided, it is assumed that this is False. The actual status of a Resource as an InstantGratificationResource is determined in the relevant Deal

	SoundRecording *SoundRecording
	Image          *Image
}

// parseERN38x parses the given XML data and returns structured data including releases, sound recordings, and images.
// NOTE: This expects the ERN 3 format. See https://kb.ddex.net/implementing-each-standard/electronic-release-notification-message-suite-(ern)/ern-3-explained/
func parseERN38x(doc *xmlquery.Node, crawledBucket, releaseID string) (tracks []common.CreateTrackRelease, albums []common.CreateAlbumRelease, errs []error) {
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
	for _, rNode := range releaseNodes {
		track, album, err := processReleaseNode(rNode, &soundRecordings, &images, crawledBucket, releaseID)
		if err != nil {
			errs = append(errs, err)
			continue
		}
		if track != nil {
			tracks = append(tracks, *track)
		} else if album != nil {
			albums = append(albums, *album)
		}
	}

	return
}

// processReleaseNode parses a <Release> into a CreateTrackRelease or CreateAlbumRelease struct.
func processReleaseNode(rNode *xmlquery.Node, soundRecordings *[]SoundRecording, images *[]Image, crawledBucket, releaseID string) (track *common.CreateTrackRelease, album *common.CreateAlbumRelease, err error) {
	releaseRef := safeInnerText(rNode.SelectElement("ReleaseReference"))
	releaseDateStr := safeInnerText(rNode.SelectElement("GlobalOriginalReleaseDate")) // TODO: This is deprecated. Need to use DealList
	durationISOStr := safeInnerText(rNode.SelectElement("Duration"))
	isrc := safeInnerText(rNode.SelectElement("ReleaseId/ISRC"))
	releaseType := safeInnerText(rNode.SelectElement("ReleaseType"))

	// Release IDs
	ddexReleaseIDs := &common.ReleaseIDs{
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
	}

	// Convert releaseDate from string of format YYYY-MM-DD to time.Time
	if releaseDateStr == "" {
		err = fmt.Errorf("missing release date for <ReleaseReference>%s</ReleaseReference>", releaseRef)
		return
	}
	releaseDate, releaseDateErr := time.Parse("2006-01-02", releaseDateStr)
	if releaseDateErr != nil {
		err = fmt.Errorf("failed to parse release date for <ReleaseReference>%s</ReleaseReference>: %s", releaseRef, releaseDateErr)
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

	title := safeInnerText(releaseDetails.SelectElement("Title[@TitleType='DisplayTitle']/TitleText")) // TODO: This assumes there aren't multiple titles in different languages (ie, different `LanguageAndScriptCode` attributes)
	artistName := safeInnerText(releaseDetails.SelectElement("DisplayArtistName"))
	genreStr := safeInnerText(releaseDetails.SelectElement("Genre/GenreText"))
	copyright := safeInnerText(releaseDetails.SelectElement("PLine/PLineText"))

	// Use <ResourceGroup> to determine the order of tracks, as per the XML schema.
	// There can be multiple <ResourceGroup>s for each "disk" in the album, but we count them all as one album with no "disk" concept.
	// We still maintain relative sorted order of tracks within each <ResourceGroup> and across all <ResourceGroup>s by sorting the slice later.
	// See https://kb.ddex.net/implementing-each-standard/best-practices-for-all-ddex-standards/guidance-on-releaseresourcework-metadata/resourcegroup-hierarchies/

	var contentItems []ResourceGroupContentItem
	processResourceGroup(releaseDetails, 0, &contentItems)

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

	if releaseType == "Album" {
		genre, ok := common.ToGenre(genreStr)
		if !ok {
			err = fmt.Errorf("unsupported genre %s for <ReleaseReference>%s</ReleaseReference>", genreStr, releaseRef)
			return
		}

		var tracks []common.TrackMetadata
		var coverArtURL, coverArtURLHash, coverArtURLHashAlgo string
		for _, ci := range contentItems {
			if ci.ResourceType == ResourceTypeSoundRecording {
				var trackMetadata *common.TrackMetadata
				trackMetadata, err = parseTrackMetadata(ci, crawledBucket, releaseID)
				if err != nil {
					return
				}
				tracks = append(tracks, *trackMetadata)
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
					if coverArtURL != "" {
						fmt.Printf("Skipping duplicate audio file for Image %s\n", ci.Reference)
					}
					coverArtURL = fmt.Sprintf("s3://%s/%s/%s%s", crawledBucket, releaseID, d.FileDetails.FilePath, d.FileDetails.FileName)
					coverArtURLHash = d.FileDetails.HashSum
					coverArtURLHashAlgo = d.FileDetails.HashSumAlgorithmType
				}
			}
		}

		album = &common.CreateAlbumRelease{
			DDEXReleaseRef: releaseRef,
			Tracks:         tracks,
			Metadata: common.CollectionMetadata{
				PlaylistName:        title,
				PlaylistOwnerName:   artistName,
				ReleaseDate:         releaseDate,
				DDEXReleaseIDs:      *ddexReleaseIDs,
				Genre:               genre,
				IsAlbum:             true,
				IsPrivate:           false, // TODO: Use DealList to determine this. Same with releaseDate because I think the XML element it's reading is deprecated
				CoverArtURL:         coverArtURL,
				CoverArtURLHash:     coverArtURLHash,
				CoverArtURLHashAlgo: coverArtURLHashAlgo,
			},
		}
		return
	}

	if releaseType == "TrackRelease" {
		if len(contentItems) > 2 {
			err = fmt.Errorf("unsupported number of <ResourceGroupContentItem>s for TrackRelease <ReleaseReference>%s</ReleaseReference>", releaseRef)
			return
		}

		// Extract file links and other details from the audio and image resources
		var trackMetadata *common.TrackMetadata
		var coverArtURL, coverArtURLHash, coverArtURLHashAlgo string
		for _, ci := range contentItems {
			if ci.ResourceType == ResourceTypeSoundRecording {
				trackMetadata, err = parseTrackMetadata(ci, crawledBucket, releaseID)
				if err != nil {
					return
				}
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
					if coverArtURL != "" {
						fmt.Printf("Skipping duplicate cover art file for Image %s\n", ci.Reference)
					}
					coverArtURL = fmt.Sprintf("s3://%s/%s/%s%s", crawledBucket, releaseID, d.FileDetails.FilePath, d.FileDetails.FileName)
					coverArtURLHash = d.FileDetails.HashSum
					coverArtURLHashAlgo = d.FileDetails.HashSumAlgorithmType
				}
			}
		}

		if trackMetadata.Title == "" {
			if title == "" {
				err = fmt.Errorf("missing title for <ReleaseReference>%s</ReleaseReference>", releaseRef)
				return
			}
			trackMetadata.Title = title
		}

		if trackMetadata.ISRC == nil || *trackMetadata.ISRC == "" {
			if isrc == "" {
				err = fmt.Errorf("missing isrc for <ReleaseReference>%s</ReleaseReference>", releaseRef)
				return
			}
			*trackMetadata.ISRC = isrc
		} else {
			if *trackMetadata.ISRC != isrc {
				// Use the ISRC from the SoundRecording if it differs from the Release ISRC
				(*ddexReleaseIDs).ISRC = *trackMetadata.ISRC
			}
		}

		if trackMetadata.Genre == "" {
			genre, ok := common.ToGenre(genreStr)
			if !ok {
				err = fmt.Errorf("unsupported genre %s for <ReleaseReference>%s</ReleaseReference>", genreStr, releaseRef)
				return
			}
			trackMetadata.Genre = genre
		}

		if trackMetadata.Duration == 0 {
			duration, durationErr := parseISODuration(durationISOStr)
			if durationErr != nil {
				err = fmt.Errorf("failed to parse duration for <ReleaseReference>%s</ReleaseReference>: %s", releaseRef, durationErr)
				return
			}
			trackMetadata.Duration = int(duration.Seconds())
		}

		trackMetadata.ArtistName = artistName
		trackMetadata.ReleaseDate = releaseDate
		trackMetadata.DDEXReleaseIDs = *ddexReleaseIDs
		trackMetadata.Copyright = copyright
		trackMetadata.CoverArtURL = coverArtURL
		trackMetadata.CoverArtURLHash = coverArtURLHash
		trackMetadata.CoverArtURLHashAlgo = coverArtURLHashAlgo

		track = &common.CreateTrackRelease{
			DDEXReleaseRef: releaseRef,
			Metadata:       *trackMetadata,
		}
		return
	}
	err = fmt.Errorf("unsupported <ReleaseType>%s</ReleaseType> for <ReleaseReference>%s</ReleaseReference>", releaseType, releaseRef)
	return
}

// parseTrackMetadata parses the metadata for a sound recording from a ResourceGroupContentItem.
func parseTrackMetadata(ci ResourceGroupContentItem, crawledBucket, releaseID string) (metadata *common.TrackMetadata, err error) {
	if ci.SoundRecording == nil {
		err = fmt.Errorf("no <SoundRecording> found for <ResourceReference>%s</ResourceReference>", ci.Reference)
		return
	}
	if len(ci.SoundRecording.TechnicalDetails) == 0 {
		err = fmt.Errorf("no <TechnicalSoundRecordingDetails> found for SoundRecording %s", ci.Reference)
		return
	}

	var audioFileURL, audioFileURLHash, audioFileURLHashAlgo, previewAudioFileURL, previewAudioFileURLHash, previewAudioFileURLHashAlgo string
	var previewStartSec int

	for _, d := range ci.SoundRecording.TechnicalDetails {
		if d.IsPreview {
			if previewAudioFileURL == "" {
				previewAudioFileURL = fmt.Sprintf("s3://%s/%s/%s%s", crawledBucket, releaseID, d.FileDetails.FilePath, d.FileDetails.FileName)
				previewAudioFileURLHash = d.FileDetails.HashSum
				previewAudioFileURLHashAlgo = d.FileDetails.HashSumAlgorithmType
				previewStartSec = d.PreviewDetails.StartPoint
			} else {
				fmt.Printf("Skipping duplicate audio preview for SoundRecording %s\n", ci.Reference)
			}
		} else {
			if audioFileURL == "" {
				audioFileURL = fmt.Sprintf("s3://%s/%s/%s%s", crawledBucket, releaseID, d.FileDetails.FilePath, d.FileDetails.FileName)
				audioFileURLHash = d.FileDetails.HashSum
				audioFileURLHashAlgo = d.FileDetails.HashSumAlgorithmType
			} else {
				fmt.Printf("Skipping duplicate audio file for SoundRecording %s\n", ci.Reference)
			}
		}
	}

	duration, _ := parseISODuration(ci.SoundRecording.Duration)
	metadata = &common.TrackMetadata{
		Title:                       ci.SoundRecording.Title,
		Duration:                    int(duration.Seconds()),
		PreviewStartSeconds:         &previewStartSec,
		ISRC:                        &ci.SoundRecording.ISRC,
		Artists:                     ci.SoundRecording.Artists,
		PreviewAudioFileURL:         previewAudioFileURL,
		PreviewAudioFileURLHash:     previewAudioFileURLHash,
		PreviewAudioFileURLHashAlgo: previewAudioFileURLHashAlgo,
		AudioFileURL:                audioFileURL,
		AudioFileURLHash:            audioFileURLHash,
		AudioFileURLHashAlgo:        audioFileURLHashAlgo,
	}
	if genre, ok := common.ToGenre(ci.SoundRecording.Genre); ok {
		metadata.Genre = genre
	}
	return
}

// processImageNode parses an <Image> node into an Image struct.
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

// processSoundRecordingNode parses a <SoundRecording> node into a SoundRecording struct.
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

	recording = &SoundRecording{
		Type:                  safeInnerText(sNode.SelectElement("SoundRecordingType")),
		ISRC:                  safeInnerText(sNode.SelectElement("SoundRecordingId/ISRC")),
		ResourceReference:     resourceRef,
		TerritoryCode:         "Worldwide",
		Title:                 safeInnerText(sNode.SelectElement("ReferenceTitle/TitleText")),
		LanguageOfPerformance: safeInnerText(sNode.SelectElement("LanguageOfPerformance")),
		Duration:              safeInnerText(sNode.SelectElement("Duration")),
		LabelName:             safeInnerText(details.SelectElement("LabelName")),
		Genre:                 safeInnerText(details.SelectElement("Genre/GenreText")),
		ParentalWarningType:   safeInnerText(details.SelectElement("ParentalWarningType")),
	}

	// Parse DisplayArtist nodes
	for _, artistNode := range xmlquery.Find(details, "DisplayArtist") {
		artist := common.Artist{
			Name: safeInnerText(artistNode.SelectElement("PartyName/FullName")),
		}
		for _, roleNode := range xmlquery.Find(artistNode, "ArtistRole") {
			artist.Roles = append(artist.Roles, safeInnerText(roleNode))
		}
		recording.Artists = append(recording.Artists, artist)
	}

	// Parse ResourceContributor nodes
	for _, contributorNode := range xmlquery.Find(details, "ResourceContributor") {
		contributor := ResourceContributor{
			Name: safeInnerText(contributorNode.SelectElement("PartyName/FullName")),
		}
		for _, roleNode := range xmlquery.Find(contributorNode, "ResourceContributorRole") {
			contributor.Roles = append(contributor.Roles, safeInnerText(roleNode))
		}
		recording.ResourceContributors = append(recording.ResourceContributors, contributor)
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
