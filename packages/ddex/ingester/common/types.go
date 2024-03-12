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
	ZIPFileETag      string    `bson:"_id"`
	ZIPFilePath      string    `bson:"zip_file_path"`
	DeliveryStatus   string    `bson:"delivery_status"`
	CreatedAt        time.Time `bson:"created_at"`
	ValidationErrors []string  `bson:"validation_errors"`

	// Note: these only contain the data to be parsed. They're moved to PendingRelease after parsing
	Releases []UnprocessedRelease `bson:"releases"`
	Batches  []UnprocessedBatch   `bson:"batches"`
}

// TODO: When processing a release where a ReleaseID already exists, we can update the existing document and have a field with edit history
// TODO: We could also just use the ETag or Upload's ID all the way through

// PendingRelease represents a fully formed release that waiting to be uploaded to Audius
type PendingRelease struct {
	ReleaseID          string             `bson:"_id"`
	DeliveryETag       string             `bson:"delivery_etag"` // Matches Delivery._id
	PublishDate        time.Time          `bson:"publish_date"`
	CreateTrackRelease CreateTrackRelease `bson:"create_track_release"`
	CreateAlbumRelease CreateAlbumRelease `bson:"create_album_release"`
	CreatedAt          time.Time          `bson:"created_at"`
	PublishErrors      []string           `bson:"publish_errors"`
	FailureCount       int                `bson:"failure_count"`
	FailedAfterUpload  bool               `bson:"failed_after_upload"` // If the release failed after uploading to Audius, which means there could be some cleanup to do
}

// PublishedRelease represents a release that has been successfully uploaded to Audius
type PublishedRelease struct {
	ReleaseID    string             `bson:"_id"`
	DeliveryETag string             `bson:"delivery_etag"`
	PublishDate  time.Time          `bson:"publish_date"`
	EntityID     string             `bson:"entity_id"`
	Blockhash    string             `bson:"blockhash"`
	Blocknumber  int64              `bson:"blocknumber"`
	Track        CreateTrackRelease `bson:"create_track_release"`
	Album        CreateAlbumRelease `bson:"create_album_release"`
	CreatedAt    time.Time          `bson:"created_at"`
}

// CreateTrackRelease contains everything the publisher app needs in order to upload a single track to Audius
type CreateTrackRelease struct {
	DDEXReleaseRef string        `bson:"ddex_release_ref"`
	Metadata       TrackMetadata `bson:"metadata"`
}

// CreateAlbumRelease contains everything the publisher app needs in order to upload a new album to Audius (including all track audio files and cover art)
type CreateAlbumRelease struct {
	DDEXReleaseRef string             `bson:"ddex_release_ref"`
	Tracks         []TrackMetadata    `bson:"tracks"`
	Metadata       CollectionMetadata `bson:"metadata"`
}
