package transcode

import (
	"fmt"

	"github.com/nats-io/nats.go"
	"golang.org/x/exp/slog"
)

func createObjStoreIfNotExists(cfg *nats.ObjectStoreConfig, jsc nats.JetStreamContext) error {
	slog.Info("creating", "cfg", cfg)
	_, err := jsc.ObjectStore(cfg.Bucket)
	if err == nats.ErrBucketNotFound || err == nats.ErrStreamNotFound {
		obj, err := jsc.CreateObjectStore(cfg)
		if err != nil {
			return fmt.Errorf("failed to create-if-not-exists object store after not found %q: %v", cfg.Bucket, err)
		}
		slog.Info("creating", obj)
	} else if err != nil {
		return fmt.Errorf("failed to create-if-not-exists object store %q: %v", cfg.Bucket, err)
	}
	return nil
}
