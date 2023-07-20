// Package persistence handles taking content from the temp store and storing it in the persistence store.
package persistence

import (
	"context"
	"errors"
	"log"
	"os"
	"strings"

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

// New creates a struct that listens to streamToStoreFrom and downloads content from the temp store to the persistent store.
func Open(blobDriverURL string) (*blob.Bucket, error) {

	if err := checkStorageCredentials(blobDriverURL); err != nil {
		return nil, err
	}

	blobStore, err := blob.OpenBucket(context.Background(), blobDriverURL)
	if err != nil {
		log.Println("failed to open bucket", blobDriverURL)
		return nil, err
	}

	return blobStore, nil
}

func parsePrefix(rawPrefix string) (Prefix, bool) {
	prefix, ok := prefixWhitelist[rawPrefix]
	return prefix, ok
}

func checkStorageCredentials(blobDriverUrl string) error {
	rawPrefix, uri, found := strings.Cut(blobDriverUrl, "://")

	prefix, ok := parsePrefix(rawPrefix)
	if !ok {
		return errors.New("blobDriverURL's prefix isn't valid. Valid prefixes include: " + strings.Join(keys(prefixWhitelist), ","))
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
				log.Println("failed to create local persistent storage dir: ", err)
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

	return errors.New("Unknown presistent storage type")
}

func keys[K comparable, V any](m map[K]V) []K {
	keys := make([]K, len(m))
	i := 0
	for k := range m {
		keys[i] = k
		i++
	}
	return keys
}
