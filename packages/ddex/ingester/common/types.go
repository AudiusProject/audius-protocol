package common

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Batch stores XML for a batch of releases
type Batch struct {
	BatchID   string           `bson:"_id"`
	BatchXML  primitive.Binary `bson:"batch_xml"`
	CreatedAt time.Time        `bson:"created_at"`

	// Unknown until parsing time
	DDEXSchema  string `bson:"ddex_schema"`  // Example: "ern/382"
	NumMessages int    `bson:"num_messages"` // The number of releases that this batch says it has
}

// Release represents a track or album to be uploaded to Audius
type Release struct {
	ReleaseID     string           `bson:"_id"`
	BatchID       string           `bson:"batch_id,omitempty"` // Only if this release is part of a batch. Matches Batch.BatchID (aka Batch._id)
	XMLRemotePath string           `bson:"xml_remote_path"`    // If it was a ZIP file, it would've been re-uploaded as a folder
	RawXML        primitive.Binary `bson:"raw_xml"`
	ParseErrors   []string         `bson:"parse_errors"`
	PublishErrors []string         `bson:"publish_errors"`
	FailureCount  int              `bson:"failure_count"`
	ReleaseStatus string           `bson:"release_status"`
	IsUpdate      bool             `bson:"is_update"`
	LastParsed    time.Time        `bson:"last_parsed"`

	// Parsed from the release's XML
	ReleaseProfile     ReleaseProfile         `bson:"release_profile"`      // "ReleaseProfileVersionId" from the DDEX XML
	ParsedReleaseElems []ParsedReleaseElement `bson:"parsed_release_elems"` // Releases parsed from XML
	SDKUploadMetadata  SDKUploadMetadata      `bson:"sdk_upload_metadata"`  // Metadata for the publisher to upload to Audius via SDK

	// Only set if the release was successfully published
	EntityID    string `bson:"entity_id"`
	Blockhash   string `bson:"blockhash"`
	Blocknumber int64  `bson:"blocknumber"`
}

// ParsedReleaseElement contains parsed details of a <Release> element
type ParsedReleaseElement struct {
	ReleaseRef        string           `bson:"release_ref"`
	IsMainRelease     bool             `bson:"is_main_release"`
	ReleaseType       ReleaseType      `bson:"release_type"`
	ReleaseIDs        ReleaseIDs       `bson:"release_ids"`
	ReleaseDate       time.Time        `bson:"release_date"`
	ValidityStartDate time.Time        `bson:"validity_start_date"`
	Resources         ReleaseResources `bson:"resources"`
	ArtistID          string           `bson:"artist_id"`
	ArtistName        string           `bson:"artist_name"`

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
	IsStreamGated                bool                  `bson:"is_stream_gated,omitempty"`
	StreamConditions             *AccessConditions     `bson:"stream_conditions,omitempty"`
	IsDownloadGated              bool                  `bson:"is_download_gated,omitempty"`
	DownloadConditions           *AccessConditions     `bson:"download_conditions,omitempty"`
	IsStreamFollowGated          bool                  `bson:"is_stream_follow_gated"`
	IsStreamTipGated             bool                  `bson:"is_stream_tip_gated"`
	IsDownloadFollowGated        bool                  `bson:"is_download_follow_gated"`
	HasDeal                      bool                  `bson:"has_deal"`
}

type USDCPurchaseConditions struct {
	Price  int            `bson:"price,omitempty"`
	Splits map[string]int `bson:"splits,omitempty"`
}

type CollectibleGatedConditions struct {
	Chain        string `bson:"chain,omitempty"`
	Address      string `bson:"address,omitempty"`
	Standard     string `bson:"standard,omitempty"`
	Name         string `bson:"name,omitempty"`
	Slug         string `bson:"slug,omitempty"`
	ImageURL     string `bson:"image_url,omitempty"`
	ExternalLink string `bson:"external_link,omitempty"`
}

type AccessConditions struct {
	USDCPurchase  *USDCPurchaseConditions     `bson:"usdc_purchase,omitempty"`
	TipUserID     string                      `bson:"tip_user_id,omitempty"`
	FollowUserID  string                      `bson:"follow_user_id,omitempty"`
	NFTCollection *CollectibleGatedConditions `bson:"nft_collection,omitempty"`
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
