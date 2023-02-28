package transcode

import (
	"fmt"

	"github.com/nats-io/nats.go"
)

func createObjStoreIfNotExists(cfg *nats.ObjectStoreConfig, jsc nats.JetStreamContext) error {
	fmt.Println("creating", cfg)
	_, err := jsc.ObjectStore(cfg.Bucket)
	if err == nats.ErrBucketNotFound || err == nats.ErrStreamNotFound {
		obj, err := jsc.CreateObjectStore(cfg)
		if err != nil {
			return fmt.Errorf("failed to create-if-not-exists object store after not found %q: %v", cfg.Bucket, err)
		}
		fmt.Println("creating", obj)
	} else if err != nil {
		return fmt.Errorf("failed to create-if-not-exists object store %q: %v", cfg.Bucket, err)
	}
	return nil
}
