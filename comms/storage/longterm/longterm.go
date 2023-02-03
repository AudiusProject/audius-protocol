// Package longterm handles taking content from the temp store and storing it in the long-term store.
package longterm

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"

	"comms.audius.co/storage/decider"
	"comms.audius.co/storage/transcode"
	"github.com/nats-io/nats.go"
	"gocloud.dev/blob"
	_ "gocloud.dev/blob/fileblob"
)

type LongTerm struct {
	storageDecider decider.StorageDecider
	jsc            nats.JetStreamContext
	blobStore      *blob.Bucket
}

// New creates a struct that listens to streamToStoreFrom and downloads content from the temp store to the long-term store.
func New(streamToStoreFrom string, storageDecider decider.StorageDecider, jsc nats.JetStreamContext) *LongTerm {

	// todo: config week
	blobDriverURL := os.Getenv("TODO_STORAGE_DRIVER_URL")
	if blobDriverURL == "" {
		tempDir := "/tmp/audius_storage"
		if err := os.MkdirAll(tempDir, os.ModePerm); err != nil {
			log.Fatalln("failed to create fallback dir", err)
		}
		blobDriverURL = "file://" + tempDir
		log.Printf("warning: no storage driver URL specified... falling back to %s \n", blobDriverURL)
	}
	b, err := blob.OpenBucket(context.Background(), blobDriverURL)
	if err != nil {
		log.Fatalln("failed to open bucket", blobDriverURL)
	}

	longTerm := &LongTerm{
		storageDecider: storageDecider,
		jsc:            jsc,
		blobStore:      b,
	}

	longTerm.runStorer(streamToStoreFrom)
	return longTerm
}

// Get returns a file from the long-term store.
func (lt *LongTerm) Get(bucketName, key string) (io.Reader, error) {
	bucketedKey := lt.storageDecider.GetNamespacedBucketFor(bucketName) + "/" + key
	reader, err := lt.blobStore.NewReader(context.Background(), bucketedKey, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to read %q: %v", bucketedKey, err)
	}
	return reader, nil
}

// runStorer runs a goroutine to pull tracks from temp NATS object storage to long-term object storage.
func (lt *LongTerm) runStorer(uploadStream string) {
	thisNodePubKey := os.Getenv("audius_delegate_owner_wallet") // TODO: Get from config or something - same for value in NewProd() above
	// Create a per-node explicit pull consumer on the stream that backs the track upload status KV bucket
	storerDurable := fmt.Sprintf("STORER_%s", thisNodePubKey)
	_, err := lt.jsc.AddConsumer(uploadStream, &nats.ConsumerConfig{
		Durable:       storerDurable,
		AckPolicy:     nats.AckExplicitPolicy,
		DeliverPolicy: nats.DeliverAllPolicy, // Using the "all" policy means when a node registers it will download every track that it needs
		ReplayPolicy:  nats.ReplayInstantPolicy,
	})
	if err != nil {
		log.Fatalf("Error creating consumer for long-term file storer: %q\n", err)
	}

	// Create a subscription on the consumer for every node
	// Subject can be empty since it defaults to all subjects bound to the stream
	storerSub, err := lt.jsc.PullSubscribe("", storerDurable, nats.BindStream(uploadStream))
	if err != nil {
		log.Fatalf("Error creating subscription for long-term file storer: %q\n", err)
	}

	// Watch KV store to download files to long-term storage
	// TODO: Maybe there should be an exit channel for in case we restart StorageServer without restarting the whole program? (e.g., if we want to update StorageDecider to pass it a new slice of storage node pubkeys)
	go func() {
		for {
			msgs, err := storerSub.Fetch(1)
			if err == nil {
				msg := msgs[0]
				if err := lt.processMessage(msg); err != nil {
					log.Printf("longterm processMessage failed: %q\n", err)
					msg.Nak()
				} else {
					msg.Ack()
				}
			} else if err != nats.ErrTimeout { // Timeout is expected when there's nothing new in the stream
				fmt.Printf("Error fetching message to store a file: %q\n", err)
			}
		}
	}()
}

// processMessage will move file to longterm storage if this server is responsible for the shard.
// should only return an error if storage failed... error will stall consumer and retry until succeeds.
// reason being: if storage fails for this file it probably will for the next and we shouldn't just go ACKing all these storage operations that failed.
// if a Nak is too extreme... we could instead retry this N times and then Ack in the calling function
func (lt *LongTerm) processMessage(msg *nats.Msg) error {
	job := transcode.Job{}
	err := json.Unmarshal(msg.Data, &job)
	if err != nil {
		log.Printf("invalid job input: %q\n", err)
		return nil
	}

	if job.Status == transcode.JobStatusDone {
		if lt.storageDecider.ShouldStore(job.ID) {
			fmt.Printf("Storing file with ID %q\n", job.ID)
			return lt.moveTempToLongTerm(job.Results)
		} else {
			fmt.Printf("Not storing file with ID %q\n", job.ID)
		}
	}

	return nil
}

func (lt *LongTerm) moveTempToLongTerm(tmpObjects []*nats.ObjectInfo) error {
	// Open the long-term storage *blob.Bucket
	for _, tmpObj := range tmpObjects {
		shard := lt.storageDecider.GetNamespacedBucketFor(tmpObj.Name)
		ltKey := shard + "/" + tmpObj.Name

		// Get object from temp store
		objStore, err := lt.jsc.ObjectStore(tmpObj.Bucket)
		if err != nil {
			return fmt.Errorf("Failed to get object from temp store: %v\n", err)
		}
		tempObj, err := objStore.Get(tmpObj.Name)
		if err != nil {
			return fmt.Errorf("Failed to get object from temp store: %v\n", err)
		}

		// Open a *blob.Writer for the blob at key=tmpObj.Bucket/tmpObj.Name
		writer, err := lt.blobStore.NewWriter(context.Background(), ltKey, nil)
		if err != nil {
			return fmt.Errorf("Failed to write %q: %v\n", ltKey, err)
		}

		// Copy the data
		_, err = io.Copy(writer, tempObj)
		if err != nil {
			return fmt.Errorf("Failed to copy data: %v\n", err)
		}

		writer.Close()
	}

	return nil
}
