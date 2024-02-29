package common

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Upload struct {
	ID         primitive.ObjectID `bson:"_id"`
	UploadETag string             `bson:"upload_etag"`
	Path       string             `bson:"path"`
	CreatedAt  time.Time          `bson:"created_at"`
}

type Delivery struct {
	ID             primitive.ObjectID `bson:"_id"`
	UploadETag     string             `bson:"upload_etag"`
	DeliveryStatus string             `bson:"delivery_status"`
	XmlFilePath    string             `bson:"xml_file_path"`
	XmlContent     primitive.Binary   `bson:"xml_content"`
	CreatedAt      time.Time          `bson:"created_at"`
	Errors         []string           `bson:"errors"`
}

type PendingRelease struct {
	ID                primitive.ObjectID `bson:"_id"`
	UploadETag        string             `bson:"upload_etag"`
	DeliveryID        primitive.ObjectID `bson:"delivery_id"`
	PublishDate       time.Time          `bson:"publish_date"`
	Track             CreateTrackRelease `bson:"create_track_release"`
	Album             CreateAlbumRelease `bson:"create_album_release"`
	CreatedAt         time.Time          `bson:"created_at"`
	Errors            []string           `bson:"errors"`
	FailureCount      int                `bson:"failure_count"`
	FailedAfterUpload bool               `bson:"failed_after_upload"`
}

type PublishedRelease struct {
	ID          primitive.ObjectID `bson:"_id"`
	UploadETag  string             `bson:"upload_etag"`
	DeliveryID  primitive.ObjectID `bson:"delivery_id"`
	PublishDate time.Time          `bson:"publish_date"`
	EntityID    string             `bson:"entity_id"`
	Blockhash   string             `bson:"blockhash"`
	Blocknumber int64              `bson:"blocknumber"`
	Track       CreateTrackRelease `bson:"create_track_release"`
	Album       CreateAlbumRelease `bson:"create_album_release"`
	CreatedAt   time.Time          `bson:"created_at"`
}

// CreateTrackRelease contains everything the publisher app needs in order to upload a single track to Audius.
type CreateTrackRelease struct {
	DDEXReleaseRef string        `bson:"ddex_release_ref"`
	Metadata       TrackMetadata `bson:"metadata"`
}

// CreateAlbumRelease contains everything the publisher app needs in order to upload a new album to Audius (including all track audio files and cover art).
type CreateAlbumRelease struct {
	DDEXReleaseRef string             `bson:"ddex_release_ref"`
	Tracks         []TrackMetadata    `bson:"tracks"`
	Metadata       CollectionMetadata `bson:"metadata"`
}
