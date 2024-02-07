package common

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Upload struct {
	ID         primitive.ObjectID `bson:"_id"`
	UploadETag string             `bson:"upload_etag"`
	Path       string             `bson:"path"`
}

type Indexed struct {
	ID             primitive.ObjectID `bson:"_id"`
	UploadETag     string             `bson:"upload_etag"`
	DeliveryID     string             `bson:"delivery_id"`
	DeliveryStatus string             `bson:"delivery_status"`
	XmlFilePath    string             `bson:"xml_file_path"`
	XmlContent     primitive.Binary   `bson:"xml_content"`
}

type Parsed struct {
	ID          primitive.ObjectID `bson:"_id"`
	UploadETag  string             `bson:"upload_etag"`
	DeliveryID  string             `bson:"delivery_id"`
	Entity      string             `bson:"entity"`
	PublishDate time.Time          `bson:"publish_date"`
}

type Published struct {
	ID          primitive.ObjectID `bson:"_id"`
	UploadETag  string             `bson:"upload_etag"`
	DeliveryID  string             `bson:"delivery_id"`
	Entity      string             `bson:"entity"`
	PublishDate time.Time          `bson:"publish_date"`
	EntityID    string             `bson:"entity_id"`
}
