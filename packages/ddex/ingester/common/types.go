package common

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// UnprocessedRelease contains data needed to parse a release from within a crawled delivery
type UnprocessedRelease struct {
	ReleaseID        string           `bson:"release_id"` // Same as the XmlFilePath's file name without the ".xml" extension
	XmlFilePath      string           `bson:"xml_file_path"`
	XmlContent       primitive.Binary `bson:"xml_content"`
	ValidationErrors []string         `bson:"validation_errors"`
}

// UnprocessedBatch contains data needed to parse a batch from within a crawled delivery
type UnprocessedBatch struct {
	BatchID          string               `bson:"batch_id"`
	BatchXmlPath     string               `bson:"batch_xml_path"`
	BatchXmlContent  primitive.Binary     `bson:"batch_xml_content"`
	Releases         []UnprocessedRelease `bson:"releases"`
	ValidationErrors []string             `bson:"validation_errors"`

	// Unknown until parsing time
	DDEXSchema  string `bson:"ddex_schema"` // Example: "ern/382"
	NumMessages int    `bson:"num_messages"`
}

// Delivery represents crawled upload contents that are ready to be parsed
type Delivery struct {
	RemotePath       string    `bson:"_id"`
	IsFolder         bool      `bson:"is_folder"`
	DeliveryStatus   string    `bson:"delivery_status"`
	CreatedAt        time.Time `bson:"created_at"`
	ValidationErrors []string  `bson:"validation_errors"`

	// Note: these only contain the data to be parsed. They're moved to PendingRelease after parsing
	Releases []UnprocessedRelease `bson:"releases"`
	Batches  []UnprocessedBatch   `bson:"batches"`
}

// TODO: When processing a release where a ReleaseID already exists, we can update the existing document and have a field with edit history

// PendingRelease represents a fully formed release that waiting to be uploaded to Audius
type PendingRelease struct {
	ReleaseID          string    `bson:"_id"`
	DeliveryRemotePath string    `bson:"delivery_remote_path"` // aka Delivery._id
	Release            Release   `bson:"release"`
	CreatedAt          time.Time `bson:"created_at"`
	PublishErrors      []string  `bson:"publish_errors"`
	FailureCount       int       `bson:"failure_count"`
	FailedAfterUpload  bool      `bson:"failed_after_upload"` // If the release failed after uploading to Audius, which means there could be some cleanup to do
}

// PublishedRelease represents a release that has been successfully uploaded to Audius
type PublishedRelease struct {
	ReleaseID          string    `bson:"_id"`
	DeliveryRemotePath string    `bson:"delivery_remote_path"`
	EntityID           string    `bson:"entity_id"`
	Blockhash          string    `bson:"blockhash"`
	Blocknumber        int64     `bson:"blocknumber"`
	Release            Release   `bson:"release"`
	CreatedAt          time.Time `bson:"created_at"`
}

type Release struct {
	ReleaseProfile     ReleaseProfile         `bson:"release_profile"`      // "ReleaseProfileVersionId" from the DDEX XML
	ParsedReleaseElems []ParsedReleaseElement `bson:"parsed_release_elems"` // Releases parsed from XML
	SDKUploadMetadata  SDKUploadMetadata      `bson:"sdk_upload_metadata"`  // Metadata for the publisher to upload to Audius via SDK
}

// ParsedReleaseElement contains parsed details of a <Release> element
type ParsedReleaseElement struct {
	ReleaseRef    string           `bson:"release_ref"`
	IsMainRelease bool             `bson:"is_main_release"`
	ReleaseType   ReleaseType      `bson:"release_type"`
	ReleaseIDs    ReleaseIDs       `bson:"release_ids"`
	ReleaseDate   time.Time        `bson:"release_date"`
	Resources     ReleaseResources `bson:"resources"`
	ArtistID      string           `bson:"artist_id"`
	ArtistName    string           `bson:"artist_name"`

	DisplayTitle                 string                `bson:"display_title"` // For displaying on the frontend
	DisplaySubtitle              NullableString        `bson:"display_subtitle,omitempty"`
	ReferenceTitle               NullableString        `bson:"reference_title,omitempty"` // (Supposed to be) for internal cataloguing and rights management
	ReferenceSubtitle            NullableString        `bson:"reference_subtitle,omitempty"`
	FormalTitle                  NullableString        `bson:"formal_title,omitempty"` // The official title registered with rights organizations
	FormalSubtitle               NullableString        `bson:"format_subtitle,omitempty"`
	Genre                        Genre                 `bson:"genre"`
	Duration                     int                   `bson:"duration"`
	PreviewStartSeconds          NullableInt           `bson:"preview_start_seconds,omitempty"`
	ISRC                         NullableString        `bson:"isrc,omitempty"` // TODO: Is this needed if we have ReleaseIDs?
	Artists                      []ResourceContributor `bson:"artists"`
	ResourceContributors         []ResourceContributor `bson:"resource_contributors,omitempty"`
	IndirectResourceContributors []ResourceContributor `bson:"indirect_resource_contributors,omitempty"`
	RightsController             *RightsController     `bson:"rights_controller,omitempty"`
	CopyrightLine                *Copyright            `bson:"copyright_line,omitempty"`
	ProducerCopyrightLine        *Copyright            `bson:"producer_copyright_line,omitempty"`
	ParentalWarningType          NullableString        `bson:"parental_warning_type,omitempty"`
}

// ReleaseResources contains the parsed resources (tracks and images) for a release
type ReleaseResources struct {
	Tracks []TrackMetadata `bson:"tracks"`
	Images []ImageMetadata `bson:"images"`
}

type ImageMetadata struct {
	URL         string `bson:"url"`
	URLHash     string `bson:"url_hash"`
	URLHashAlgo string `bson:"url_hash_algo"`
}

// "<ReleaseType>" element from the DDEX XML
type ReleaseType string

const (
	AlbumReleaseType ReleaseType = "Album"
	EPReleaseType    ReleaseType = "EP"
	TrackReleaseType ReleaseType = "TrackRelease"

	// Singles are essentially a 1-track album release, which we don't support.
	// Instead, we preserve the outer release's data but only upload the track by itself (not as part of a "Single" / 1-track album)
	SingleReleaseType ReleaseType = "Single"
)

var StringToReleaseType = map[string]ReleaseType{
	"Album":        AlbumReleaseType,
	"EP":           EPReleaseType,
	"TrackRelease": TrackReleaseType,
	"Single":       SingleReleaseType,
}

// "ReleaseProfileVersionId" from the DDEX XML
type ReleaseProfile string

const (
	Common13AudioSingle                        = "CommonReleaseTypes/13/AudioSingle"
	Common14AudioAlbumMusicOnly ReleaseProfile = "CommonReleaseTypesTypes/14/AudioAlbumMusicOnly"
	UnspecifiedReleaseProfile   ReleaseProfile = "Unspecified"
)
