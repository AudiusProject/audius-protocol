package common

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Upload struct {
	ID         primitive.ObjectID `bson:"_id"`
	Path       string             `bson:"path"`
	UploadETag string             `bson:"upload_etag"`
}

type Indexed struct {
	ID          primitive.ObjectID `bson:"_id"`
	DeliveryID  string             `bson:"delivery_id"`
	UploadETag  string             `bson:"upload_etag"`
	XmlFilePath string             `bson:"xml_file_path"`
	XmlContent  primitive.Binary   `bson:"xml_content"`
}

type Parsed struct {
	ID          primitive.ObjectID `bson:"_id"`
	DeliveryID  string             `bson:"delivery_id"`
	UploadETag  string             `bson:"upload_etag"`
	Entity      string             `bson:"entity"`
	PublishDate time.Time          `bson:"publish_date"`
}
