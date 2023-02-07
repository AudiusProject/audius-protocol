package transcode

import (
	"fmt"
	"log"

	"github.com/nats-io/nats.go"
)

func createObjStoreIfNotExists(cfg *nats.ObjectStoreConfig, jsc nats.JetStreamContext) {
	fmt.Println("creating", cfg)
	_, err := jsc.ObjectStore(cfg.Bucket)
	if err == nats.ErrBucketNotFound || err == nats.ErrStreamNotFound {
		obj, err := jsc.CreateObjectStore(cfg)
		if err != nil {
			log.Fatalf("Failed to create-if-not-exists object store %q: %v", cfg.Bucket, err)
		}
		fmt.Println("creating", obj)
	} else if err != nil {
		log.Fatalf("Failed to create-if-not-exists object store %q: %v", cfg.Bucket, err)
	}
}
