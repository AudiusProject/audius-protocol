// Package longterm handles taking content from the temp store and storing it in the long-term store.
package longterm

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"comms.audius.co/storage/decider"
	"comms.audius.co/storage/transcode"
	"github.com/nats-io/nats.go"
	"gocloud.dev/blob"
)

type LongTerm struct {
	storageDecider decider.StorageDecider
	jsc            nats.JetStreamContext
}

// New creates a struct that listens to streamToStoreFrom and downloads content from the temp store to the long-term store.
func New(streamToStoreFrom string, storageDecider decider.StorageDecider, jsc nats.JetStreamContext) *LongTerm {
	longTerm := &LongTerm{
		storageDecider: storageDecider,
		jsc:            jsc,
	}

	os.MkdirAll(getFileBucketPath(), os.ModePerm)
	longTerm.runStorer(streamToStoreFrom)
	return longTerm
}

// Get returns a file from the long-term store.
func (lt *LongTerm) Get(key string) (io.Reader, error) {
	ctx := context.Background()
	bucket, err := blob.OpenBucket(ctx, getBucketUrl())
	if err != nil {
		return nil, fmt.Errorf("could not open long-term bucket: %v", err)
	}
	defer bucket.Close()

	reader, err := bucket.NewReader(ctx, key, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to read %q: %v", key, err)
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
		panic(err)
	}

	// Create a subscription on the consumer for every node
	// Subject can be empty since it defaults to all subjects bound to the stream
	storerSub, err := lt.jsc.PullSubscribe("", storerDurable, nats.BindStream(uploadStream))
	if err != nil {
		panic(err)
	}

	// Watch KV store to download files to long-term storage
	// TODO: Maybe there should be an exit channel for in case we restart StorageServer without restarting the whole program? (e.g., if we want to update StorageDecider to pass it a new slice of storage node pubkeys)
	go func() {
		for {
			msgs, err := storerSub.Fetch(1)
			if err == nil {
				msgs[0].Ack()

				job := transcode.Job{}
				err := json.Unmarshal(msgs[0].Data, &job)
				if err != nil {
					panic(err)
				}

				if job.Status == transcode.JobStatusDone {
					if lt.storageDecider.ShouldStore(job.ID) {
						fmt.Printf("Storing file with ID %q\n", job.ID)
						lt.moveTempToLongTerm(job.Results)
					} else {
						fmt.Printf("Not storing file with ID %q\n", job.ID)
						continue
					}
				}
			} else if err != nats.ErrTimeout { // Timeout is expected when there's nothing new in the stream
				fmt.Printf("Error fetching message to store a file: %q\n", err)
			}
		}
	}()
}

func (lt *LongTerm) moveTempToLongTerm(tmpObjects []*nats.ObjectInfo) {
	// Open the long-term storage *blob.Bucket
	ctx := context.Background()
	bucket, err := blob.OpenBucket(ctx, getBucketUrl())
	if err != nil {
		fmt.Printf("error: failed to store file - could not open bucket: %v", err)
		return
	}
	defer bucket.Close()

	for _, tmpObj := range tmpObjects {
		// Get object from temp store
		objStore, err := lt.jsc.ObjectStore(tmpObj.Bucket)
		if err != nil {
			log.Printf("Failed to get object from temp store: %v\n", err)
			return
		}
		tempObj, err := objStore.Get(tmpObj.Name)
		if err != nil {
			log.Printf("Failed to get object from temp store: %v\n", err)
			return
		}

		// Open a *blob.Writer for the blob at key=tmpObj.Name
		writer, err := bucket.NewWriter(ctx, tmpObj.Name, nil)
		if err != nil {
			log.Printf("Failed to write %q: %v\n", tmpObj.Name, err)
			return
		}
		defer writer.Close()

		// Copy the data
		_, err = io.Copy(writer, tempObj)
		if err != nil {
			log.Printf("Failed to copy data: %v\n", err)
			return
		}
	}
}

// getBucketUrl returns the URL for the long-term storage bucket - default file storage at /tmp/audius-long-term.
func getBucketUrl() string {
	return "file://" + getFileBucketPath()
}

func getFileBucketPath() string {
	rootDir := "/tmp/audius-long-term"
	// On Windows, convert "\" to "/" (for in case rootDir is an env var in the future) and add a leading "/":
	slashDir := filepath.ToSlash(rootDir)
	if os.PathSeparator != '/' && !strings.HasPrefix(slashDir, "/") {
		slashDir = "/" + slashDir
	}
	return slashDir
}
