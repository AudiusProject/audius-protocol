// Package longterm handles taking content from the temp store and storing it in the long-term store.
package longterm

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"

	"comms.audius.co/storage/decider"
	"comms.audius.co/storage/transcode"
	"github.com/nats-io/nats.go"
	"gocloud.dev/blob"
	_ "gocloud.dev/blob/fileblob"
)

type LongTerm struct {
	streamToStoreFrom string
	storageDecider    decider.StorageDecider
	jsc               nats.JetStreamContext
}

// Created within the temp folder (/tmp) to store files that are being downloaded from the temp store to the long-term store.
const longTermDir = "audius-long-term"

// New creates a struct that listens to streamToStoreFrom and downloads content from the temp store to the long-term store.
func New(streamToStoreFrom string, storageDecider decider.StorageDecider, jsc nats.JetStreamContext) *LongTerm {
	longTerm := &LongTerm{
		streamToStoreFrom: streamToStoreFrom,
		storageDecider:    storageDecider,
		jsc:               jsc,
	}

	err := os.MkdirAll(getFileBucketPath(), os.ModePerm)
	if err != nil {
		log.Fatalf("could not create long-term storage directory: %v", err)
	}
	longTerm.runStorer()
	return longTerm
}

// Get returns a file from the long-term store.
func (lt *LongTerm) Get(bucketName, key string) (*blob.Reader, error) {
	ctx := context.Background()
	blobBucket, err := blob.OpenBucket(ctx, getBucketUrl())
	if err != nil {
		return nil, fmt.Errorf("could not open long-term bucket: %v", err)
	}
	defer blobBucket.Close()

	bucketedKey := lt.storageDecider.GetNamespacedBucketFor(bucketName) + "/" + key
	reader, err := blobBucket.NewReader(ctx, bucketedKey, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to read %q: %v", bucketedKey, err)
	}
	return reader, nil
}

func (lt *LongTerm) GetKeysIn(bucketName string) ([]string, error) {
	// Open the long-term storage *blob.Bucket
	ctx := context.Background()
	blobBucket, err := blob.OpenBucket(ctx, getBucketUrl())
	if err != nil {
		fmt.Printf("error: failed to get all files in bucket - could not open blob bucket: %v", err)
		return nil, err
	}
	defer blobBucket.Close()
	it := blobBucket.List(&blob.ListOptions{Prefix: lt.storageDecider.GetNamespacedBucketFor(bucketName)})

	keys := []string{}

	for {
		obj, err := it.Next(ctx)
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		keys = append(keys, obj.Key)
	}
	return keys, nil
}

type KeyAndMD5 struct {
	Key string `json:"key"`
	MD5 string `json:"md5"`
}

func (lt *LongTerm) GetKeysAndMD5sIn(bucketName string) ([]*KeyAndMD5, error) {
	// Open the long-term storage *blob.Bucket
	ctx := context.Background()
	blobBucket, err := blob.OpenBucket(ctx, getBucketUrl())
	if err != nil {
		fmt.Printf("error: failed to get all files in bucket - could not open blob bucket: %v", err)
		return nil, err
	}
	defer blobBucket.Close()
	it := blobBucket.List(&blob.ListOptions{Prefix: lt.storageDecider.GetNamespacedBucketFor(bucketName)})

	keysAndMD5s := []*KeyAndMD5{}
	for {
		obj, err := it.Next(ctx)
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		attrs, err := blobBucket.Attributes(ctx, obj.Key)
		if err != nil {
			return nil, err
		}
		keysAndMD5s = append(keysAndMD5s, &KeyAndMD5{Key: obj.Key, MD5: hex.EncodeToString(attrs.MD5)})
	}
	return keysAndMD5s, nil
}

type BucketAndFile struct {
	Bucket   string
	FileName string
	MD5      string
}

func (lt *LongTerm) GetJobResultsFor(id string) ([]*BucketAndFile, error) {
	// Get the job from the KV store for the given ID
	kv, err := lt.jsc.KeyValue(lt.streamToStoreFrom[len("KV_"):])
	if err != nil {
		return nil, fmt.Errorf("could not get KV store: %v", err)
	}
	entry, err := kv.Get(id)
	if err != nil {
		return nil, fmt.Errorf("could not get ID %q KV store: %v", id, err)
	}
	var job transcode.Job
	err = json.Unmarshal(entry.Value(), &job)
	if err != nil {
		return nil, fmt.Errorf("could not unmarshal KV entry: %v", err)
	}

	// Open the long-term storage *blob.Bucket
	ctx := context.Background()
	blobBucket, err := blob.OpenBucket(ctx, getBucketUrl())
	if err != nil {
		fmt.Printf("error: failed to get all files in bucket - could not open blob bucket: %v", err)
		return nil, err
	}
	defer blobBucket.Close()

	// Get the resulting outputs of each job from long-term storage
	files := []*BucketAndFile{}
	for _, jobOutput := range job.Results {
		outputBucket := lt.storageDecider.GetNamespacedBucketFor(jobOutput.Bucket)
		outputKey := outputBucket + "/" + jobOutput.Name
		exists, err := blobBucket.Exists(ctx, outputKey)
		if err != nil {
			return nil, fmt.Errorf("error: failed to check if %q exists in long-term storage: %v", outputKey, err)
		}
		if exists {
			attrs, err := blobBucket.Attributes(ctx, outputKey)
			if err != nil {
				return nil, fmt.Errorf("error: failed to get attributes for %q in long-term storage: %v", outputKey, err)
			}
			files = append(files, &BucketAndFile{
				Bucket:   jobOutput.Bucket,
				FileName: jobOutput.Name,
				MD5:      hex.EncodeToString(attrs.MD5),
			})
		} else {
			files = append(files, &BucketAndFile{
				Bucket:   jobOutput.Bucket,
				FileName: jobOutput.Name,
				MD5:      "ERROR: FILE DOES NOT EXIST",
			})
		}
	}
	return files, nil
}

// runStorer runs a goroutine to pull tracks from temp NATS object storage to long-term object storage.
func (lt *LongTerm) runStorer() {
	thisNodePubKey := os.Getenv("audius_delegate_owner_wallet") // TODO: Get from config or something - same for value in NewProd() above
	// Create a per-node explicit pull consumer on the stream that backs the track upload status KV bucket
	storerDurable := fmt.Sprintf("STORER_%s", thisNodePubKey)
	_, err := lt.jsc.AddConsumer(lt.streamToStoreFrom, &nats.ConsumerConfig{
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
	storerSub, err := lt.jsc.PullSubscribe("", storerDurable, nats.BindStream(lt.streamToStoreFrom))
	if err != nil {
		log.Fatalf("Error creating subscription for long-term file storer: %q\n", err)
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
					log.Printf("Error unmarshalling job to store a file: %q\n", err)
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
	blobBucket, err := blob.OpenBucket(ctx, getBucketUrl())
	if err != nil {
		fmt.Printf("error: failed to store file - could not open bucket: %v", err)
		return
	}
	defer blobBucket.Close()

	for _, tmpObj := range tmpObjects {
		tmpBucketName := lt.storageDecider.GetNamespacedBucketFor(tmpObj.Bucket)
		ltKey := tmpBucketName + "/" + tmpObj.Name

		// Get object from temp store
		objStore, err := lt.jsc.ObjectStore(tmpBucketName)
		if err != nil {
			log.Printf("Failed to get object from temp store: %v\n", err)
			return
		}
		tempObj, err := objStore.Get(tmpObj.Name)
		if err != nil {
			log.Printf("Failed to get object from temp store: %v\n", err)
			return
		}

		// Open a *blob.Writer for the blob at key=bucket/tmpObj.Name
		tempObjBytes, err := ioutil.ReadAll(tempObj)
		if err != nil {
			log.Printf("Failed to read bytes of temp file: %v\n", err)
			return
		}
		err = blobBucket.WriteAll(ctx, ltKey, tempObjBytes, nil)
		if err != nil {
			log.Printf("Failed to write %q: %v\n", ltKey, err)
			return
		}
	}
}

// getBucketUrl returns the URL for the long-term storage bucket - default file storage at /tmp/audius-long-term.
func getBucketUrl() string {
	return "file://" + getFileBucketPath()
}

func getFileBucketPath() string {
	return filepath.Join(os.TempDir(), longTermDir)
}
