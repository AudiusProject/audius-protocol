// Package longterm handles taking content from the temp store and storing it in the long-term store.
package longterm

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"strings"

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
	blobStore         *blob.Bucket
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
		streamToStoreFrom: streamToStoreFrom,
		storageDecider:    storageDecider,
		jsc:               jsc,
		blobStore:         b,
	}

	longTerm.runStorer()
	return longTerm
}

// GetKeyForFileName returns the key (including namespaced shard) for long-term storage for fileName, which MUST end in "_<string>.<extension>".
// fileName can optionally have a shard already prepended (e.g., "<shard>/<cuid>_<string>.<extension>")
func (lt *LongTerm) getKeyForFileName(fileName string) (string, error) {
	if idx := strings.LastIndex(fileName, "_"); idx != -1 {
		cuid := fileName[:idx]
		suffix := fileName[idx+1:]

		if len(cuid) > 25 {
			// We have a possibly valid cuid with a shard prepended (ex: "0_aa/abcdefghijkl0123456789maa") that we can parse into a shard after removing the prefix.
			cuid = cuid[strings.Index(cuid, "/")+1:]
		}

		namespacedShard, err := lt.storageDecider.GetNamespacedShardForID(cuid)
		if err != nil {
			return "", fmt.Errorf("unable to parse shard from fileName %q with cuid %q: %v", fileName, cuid, err)
		}
		return fmt.Sprintf("%s/%s_%s", namespacedShard, cuid, suffix), nil
	} else {
		return "", fmt.Errorf("fileName did not end with _<string>.<extension>: %q", fileName)
	}
}

// Get returns a file from the long-term store.
func (lt *LongTerm) Get(fileName string) (io.Reader, error) {
	key, err := lt.getKeyForFileName(fileName)
	if err != nil {
		return nil, fmt.Errorf("failed to get key for %q: %v", fileName, err)
	}
	reader, err := lt.blobStore.NewReader(context.Background(), key, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to read %q: %v", key, err)
	}
	return reader, nil
}

func (lt *LongTerm) GetKeysIn(shard string) ([]string, error) {
	it := lt.blobStore.List(&blob.ListOptions{Prefix: shard})

	keys := []string{}

	for {
		obj, err := it.Next(context.Background())
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

func (lt *LongTerm) GetKeysAndMD5sIn(shard string) ([]*KeyAndMD5, error) {
	it := lt.blobStore.List(&blob.ListOptions{Prefix: shard})

	keysAndMD5s := []*KeyAndMD5{}
	for {
		obj, err := it.Next(context.Background())
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		attrs, err := lt.blobStore.Attributes(context.Background(), obj.Key)
		if err != nil {
			return nil, err
		}
		keysAndMD5s = append(keysAndMD5s, &KeyAndMD5{Key: obj.Key, MD5: hex.EncodeToString(attrs.MD5)})
	}
	return keysAndMD5s, nil
}

type ShardAndFile struct {
	Shard    string `json:"shard"`
	FileName string `json:"fileName"`
	MD5      string `json:"md5"`
}

func (lt *LongTerm) GetJobResultsFor(id string) ([]*ShardAndFile, error) {
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

	// Get the shard that the job's output should be stored in
	shard, err := lt.storageDecider.GetNamespacedShardForID(job.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get shard for %q: %v", job.ID, err)
	}

	// Get the resulting outputs of each job from long-term storage
	files := []*ShardAndFile{}
	for _, jobOutput := range job.Results {
		outputKey := shard + "/" + jobOutput.Name
		exists, err := lt.blobStore.Exists(context.Background(), outputKey)
		if err != nil {
			return nil, fmt.Errorf("error: failed to check if %q exists in long-term storage: %v", outputKey, err)
		}
		if exists {
			attrs, err := lt.blobStore.Attributes(context.Background(), outputKey)
			if err != nil {
				return nil, fmt.Errorf("error: failed to get attributes for %q in long-term storage: %v", outputKey, err)
			}
			files = append(files, &ShardAndFile{
				Shard:    shard,
				FileName: jobOutput.Name,
				MD5:      hex.EncodeToString(attrs.MD5),
			})
		} else {
			files = append(files, &ShardAndFile{
				Shard:    shard,
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

		shouldStore, err := lt.storageDecider.ShouldStore(job.ID)
		if err != nil {
			return fmt.Errorf("failed to determine if should store %q: %q", job.ID, err)
		}
		if shouldStore {
			fmt.Printf("Storing file with ID %q\n", job.ID)
			return lt.moveTempToLongTerm(job)
		} else {
			fmt.Printf("Not storing file with ID %q\n", job.ID)
		}
	}

	return nil
}

func (lt *LongTerm) moveTempToLongTerm(job transcode.Job) error {
	// Store results in long-term shard, which is different from the temp store's bucket name
	shard, err := lt.storageDecider.GetNamespacedShardForID(job.ID)
	if err != nil {
		return fmt.Errorf("failed to get shard for %q: %v", job.ID, err)
	}

	for _, tmpObj := range job.Results {
		ltKey := shard + "/" + tmpObj.Name

		// Get object from temp store
		objStore, err := lt.jsc.ObjectStore(tmpObj.Bucket)
		if err != nil {
			return fmt.Errorf("failed to get object from temp store: %v", err)
		}
		tempObj, err := objStore.Get(tmpObj.Name)
		if err != nil {
			return fmt.Errorf("failed to get object from temp store: %v", err)
		}

		// Open a *blob.Writer for the blob at key=shard/tmpObj.Name
		writer, err := lt.blobStore.NewWriter(context.Background(), ltKey, nil)
		if err != nil {
			return fmt.Errorf("failed to write %q: %v", ltKey, err)
		}

		// Copy the data
		_, err = io.Copy(writer, tempObj)
		if err != nil {
			return fmt.Errorf("failed to copy data: %v", err)
		}

		writer.Close()
	}

	return nil
}
