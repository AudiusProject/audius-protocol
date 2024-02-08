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
}

type PendingRelease struct {
	ID          primitive.ObjectID `bson:"_id"`
	UploadETag  string             `bson:"upload_etag"`
	DeliveryID  primitive.ObjectID `bson:"delivery_id"`
	Entity      string             `bson:"entity"`
	PublishDate time.Time          `bson:"publish_date"`
	CreatedAt   time.Time          `bson:"created_at"`
}

type PublishedRelease struct {
	ID          primitive.ObjectID `bson:"_id"`
	UploadETag  string             `bson:"upload_etag"`
	DeliveryID  primitive.ObjectID `bson:"delivery_id"`
	Entity      string             `bson:"entity"`
	PublishDate time.Time          `bson:"publish_date"`
	EntityID    string             `bson:"entity_id"`
	CreatedAt   time.Time          `bson:"created_at"`
}
