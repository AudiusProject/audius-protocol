// Package persistence handles taking content from the temp store and storing it in the persistence store.
package persistence

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"

	"comms.audius.co/shared/utils"
	"comms.audius.co/storage/decider"
	"comms.audius.co/storage/transcode"
	"github.com/nats-io/nats.go"
	"golang.org/x/exp/slog"

	"gocloud.dev/blob"
	_ "gocloud.dev/blob/azureblob"
	_ "gocloud.dev/blob/fileblob"
	_ "gocloud.dev/blob/gcsblob"
	_ "gocloud.dev/blob/s3blob"
)

const (
	AWS_ACCESS_KEY_ID     = "AWS_ACCESS_KEY_ID"
	AWS_SECRET_ACCESS_KEY = "AWS_SECRET_ACCESS_KEY"
	AWS_REGION            = "AWS_REGION"

	GOOGLE_APPLICATION_CREDENTIALS = "GOOGLE_APPLICATION_CREDENTIALS"

	AZURE_STORAGE_ACCOUNT = "AZURE_STORAGE_ACCOUNT"
	AZURE_STORAGE_KEY     = "AZURE_STORAGE_KEY"
)

type Prefix int

const (
	FILE Prefix = iota
	HTTP
	GS
	S3
	AZBLOB
)

var prefixWhitelist = map[string]Prefix{
	"file":   FILE,
	"http":   HTTP,
	"https":  HTTP,
	"gs":     GS,
	"s3":     S3,
	"azblob": AZBLOB,
}

type Persistence struct {
	streamToStoreFrom string
	storageDecider    decider.StorageDecider
	jsc               nats.JetStreamContext
	blobStore         *blob.Bucket
}

// New creates a struct that listens to streamToStoreFrom and downloads content from the temp store to the persistent store.
func New(thisNodePubKey, streamToStoreFrom, blobDriverURL string, storageDecider decider.StorageDecider, jsc nats.JetStreamContext) (*Persistence, error) {

	if err := checkStorageCredentials(blobDriverURL); err != nil {
		return nil, err
	}

	b, err := blob.OpenBucket(context.Background(), blobDriverURL)
	if err != nil {
		slog.Error("failed to open bucket" + blobDriverURL, err)
		return nil, err
	}

	persistence := &Persistence{
		streamToStoreFrom: streamToStoreFrom,
		storageDecider:    storageDecider,
		jsc:               jsc,
		blobStore:         b,
	}

	err = persistence.runStorer(thisNodePubKey)
	if err != nil {
		return nil, err
	}

	return persistence, nil
}

// GetKeyForFileName returns the key (including namespaced shard) for persistent storage for fileName, which MUST end in "_<string>.<extension>".
// fileName can optionally have a shard already prepended (e.g., "<shard>/<cuid>_<string>.<extension>")
func (persist *Persistence) getKeyForFileName(fileName string) (string, error) {
	if idx := strings.LastIndex(fileName, "_"); idx != -1 {
		cuid := fileName[:idx]
		suffix := fileName[idx+1:]

		if len(cuid) > 25 {
			// We have a possibly valid cuid with a shard prepended (ex: "0_aa/abcdefghijkl0123456789maa") that we can parse into a shard after removing the prefix.
			cuid = cuid[strings.Index(cuid, "/")+1:]
		}

		namespacedShard, err := persist.storageDecider.GetNamespacedShardForID(cuid)
		if err != nil {
			return "", fmt.Errorf("unable to parse shard from fileName %q with cuid %q: %v", fileName, cuid, err)
		}
		return fmt.Sprintf("%s/%s_%s", namespacedShard, cuid, suffix), nil
	} else {
		return "", fmt.Errorf("fileName did not end with _<string>.<extension>: %q", fileName)
	}
}

// Get returns a file from the persistent store.
func (persist *Persistence) Get(fileName string) (io.Reader, error) {
	key, err := persist.getKeyForFileName(fileName)
	if err != nil {
		return nil, fmt.Errorf("failed to get key for %q: %v", fileName, err)
	}
	reader, err := persist.blobStore.NewReader(context.Background(), key, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to read %q: %v", key, err)
	}
	return reader, nil
}

func (persist *Persistence) GetKeysIn(shard string) ([]string, error) {
	it := persist.blobStore.List(&blob.ListOptions{Prefix: shard})

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

func (persist *Persistence) GetKeysAndMD5sIn(shard string) ([]*KeyAndMD5, error) {
	it := persist.blobStore.List(&blob.ListOptions{Prefix: shard})

	keysAndMD5s := []*KeyAndMD5{}
	for {
		obj, err := it.Next(context.Background())
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		attrs, err := persist.blobStore.Attributes(context.Background(), obj.Key)
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

func (persist *Persistence) GetJobResultsFor(id string) ([]*ShardAndFile, error) {
	// Get the job from the KV store for the given ID
	kv, err := persist.jsc.KeyValue(persist.streamToStoreFrom[len("KV_"):])
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
	shard, err := persist.storageDecider.GetNamespacedShardForID(job.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get shard for %q: %v", job.ID, err)
	}

	// Get the resulting outputs of each job from persistent storage
	files := []*ShardAndFile{}
	for _, jobOutput := range job.Results {
		outputKey := shard + "/" + jobOutput.Name
		exists, err := persist.blobStore.Exists(context.Background(), outputKey)
		if err != nil {
			return nil, fmt.Errorf("error: failed to check if %q exists in persistent storage: %v", outputKey, err)
		}
		if exists {
			attrs, err := persist.blobStore.Attributes(context.Background(), outputKey)
			if err != nil {
				return nil, fmt.Errorf("error: failed to get attributes for %q in persistent storage: %v", outputKey, err)
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

// runStorer runs a goroutine to pull tracks from temp NATS object storage to persistent object storage.
func (persist *Persistence) runStorer(thisNodePubKey string) error {
	// Create a per-node explicit pull consumer on the stream that backs the track upload status KV bucket
	storerDurable := fmt.Sprintf("STORER_%s", thisNodePubKey)
	_, err := persist.jsc.AddConsumer(persist.streamToStoreFrom, &nats.ConsumerConfig{
		Durable:       storerDurable,
		AckPolicy:     nats.AckExplicitPolicy,
		DeliverPolicy: nats.DeliverAllPolicy, // Using the "all" policy means when a node registers it will download every track that it needs
		ReplayPolicy:  nats.ReplayInstantPolicy,
	})
	if err != nil {
		slog.Error("Error creating consumer for persistent file storer", err)
		return err
	}

	// Create a subscription on the consumer for every node
	// Subject can be empty since it defaults to all subjects bound to the stream
	storerSub, err := persist.jsc.PullSubscribe("", storerDurable, nats.BindStream(persist.streamToStoreFrom))
	if err != nil {
		slog.Error("Error creating subscription for persistent file storer", err)
		return err
	}

	// Watch KV store to download files to persistent storage
	// TODO: Maybe there should be an exit channel for in case we restart StorageServer without restarting the whole program? (e.g., if we want to update StorageDecider to pass it a new slice of storage node pubkeys)
	go func() {
		for {
			msgs, err := storerSub.Fetch(1)
			if err == nil {
				msg := msgs[0]
				if err := persist.processMessage(msg); err != nil {
					slog.Error("persistent processMessage failed", err)
					msg.Nak()
				} else {
					msg.Ack()
				}
			} else if err != nats.ErrTimeout { // Timeout is expected when there's nothing new in the stream
				fmt.Printf("Error fetching message to store a file: %q\n", err)
			}
		}
	}()

	return nil
}

// processMessage will move file to persistent storage if this server is responsible for the shard.
// should only return an error if storage failed... error will stall consumer and retry until succeeds.
// reason being: if storage fails for this file it probably will for the next and we shouldn't just go ACKing all these storage operations that failed.
// if a Nak is too extreme... we could instead retry this N times and then Ack in the calling function
func (persist *Persistence) processMessage(msg *nats.Msg) error {
	job := transcode.Job{}
	err := json.Unmarshal(msg.Data, &job)
	if err != nil {
		slog.Error("invalid job input", err)
		return nil
	}

	if job.Status == transcode.JobStatusDone {

		shouldStore, err := persist.storageDecider.ShouldStore(job.ID)
		if err != nil {
			return fmt.Errorf("failed to determine if should store %q: %q", job.ID, err)
		}
		if shouldStore {
			slog.With("jobId", job.ID).Info("storing file with ID")
			return persist.moveTempToPersistent(job)
		} else {
			slog.With("jobId", job.ID).Info("not storing file with ID")
		}
	}

	return nil
}

func (persist *Persistence) moveTempToPersistent(job transcode.Job) error {
	// Store results in persistent shard, which is different from the temp store's bucket name
	shard, err := persist.storageDecider.GetNamespacedShardForID(job.ID)
	if err != nil {
		return fmt.Errorf("failed to get shard for %q: %v", job.ID, err)
	}

	for _, tmpObj := range job.Results {
		persistKey := shard + "/" + tmpObj.Name

		// Get object from temp store
		objStore, err := persist.jsc.ObjectStore(tmpObj.Bucket)
		if err != nil {
			return fmt.Errorf("failed to get object from temp store: %v", err)
		}
		tempObj, err := objStore.Get(tmpObj.Name)
		if err != nil {
			return fmt.Errorf("failed to get object from temp store: %v", err)
		}

		// Open a *blob.Writer for the blob at key=shard/tmpObj.Name
		writer, err := persist.blobStore.NewWriter(context.Background(), persistKey, nil)
		if err != nil {
			return fmt.Errorf("failed to write %q: %v", persistKey, err)
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

func parsePrefix(rawPrefix string) (Prefix, bool) {
	prefix, ok := prefixWhitelist[rawPrefix]
	return prefix, ok
}

func checkStorageCredentials(blobDriverUrl string) error {
	// TODO: this logic should probably be in the config module
	rawPrefix, uri, found := strings.Cut(blobDriverUrl, "://")

	prefix, ok := parsePrefix(rawPrefix)
	if !ok {
		return errors.New("blobDriverURL's prefix isn't valid. Valid prefixes include: " + strings.Join(utils.Keys(prefixWhitelist), ","))
	}

	// S3: https://github.com/google/go-cloud/blob/master/blob/s3blob/example_test.go#L73
	// GS: https://github.com/google/go-cloud/blob/master/blob/gcsblob/example_test.go#L57
	// AZBLOB: https://github.com/google/go-cloud/blob/master/blob/azureblob/example_test.go#L71
	switch prefix {
	case FILE:
		// no credentials needed for the file storage driver
		// but we do make sure the directory exists
		if found {
			if err := os.MkdirAll(uri, os.ModePerm); err != nil {
				slog.Error("failed to create local persistent storage dir", err)
				return err
			}
		}

		return nil
	case GS:
		// Check for gcloud cred env vars
		googleAppCredentials := os.Getenv(GOOGLE_APPLICATION_CREDENTIALS)

		if googleAppCredentials == "" {
			return errors.New("Missing credentials required for persistent GS backing (i.e. GOOGLE_APPLICATION_CREDENTIALS)")
		}

		return nil
	case AZBLOB:
		azureStorageAccount := os.Getenv(AZURE_STORAGE_ACCOUNT)
		azureStorageKey := os.Getenv(AZURE_STORAGE_KEY)

		if azureStorageAccount == "" || azureStorageKey == "" {
			return errors.New("Missing credentials required for persistent Azure backing (i.e. AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY)")
		}

		return nil
	case HTTP, S3:
		// https defaults to S3
		// solutions like Minio use https links for storage but use an S3 compatible API

		accessKey := os.Getenv(AWS_ACCESS_KEY_ID)
		secretKey := os.Getenv(AWS_SECRET_ACCESS_KEY)
		region := os.Getenv(AWS_REGION)

		if accessKey == "" || secretKey == "" || region == "" {
			return errors.New("Missing credentials required for persistent S3 backing (i.e. AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY)")
		}

		// check for s3 env vars
		return nil
	}

	return errors.New("unknown presistent storage type")
}
