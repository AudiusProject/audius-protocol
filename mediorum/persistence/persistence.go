// Package persistence handles taking content from the temp store and storing it in the persistence store.
package persistence

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"gocloud.dev/blob"
	_ "gocloud.dev/blob/azureblob"
	_ "gocloud.dev/blob/fileblob"
	_ "gocloud.dev/blob/gcsblob"
	_ "gocloud.dev/blob/s3blob"
	"golang.org/x/exp/maps"
	"golang.org/x/sync/errgroup"
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
		return errors.New("blobDriverURL's prefix isn't valid. Valid prefixes include: " + strings.Join(maps.Keys(prefixWhitelist), ","))
	}

	// S3: https://github.com/google/go-cloud/blob/master/blob/s3blob/example_test.go#L73
	// GS: https://github.com/google/go-cloud/blob/master/blob/gcsblob/example_test.go#L57
	// AZBLOB: https://github.com/google/go-cloud/blob/master/blob/azureblob/example_test.go#L71
	switch prefix {
	case FILE:
		// remove options from the uri so it's just the path
		path := strings.Split(uri, "?")[0]

		// no credentials needed for the file storage driver
		// but we do make sure the directory exists
		if found {
			if err := os.MkdirAll(path, os.ModePerm); err != nil {
				log.Println("failed to create local persistent storage dir: ", err)
				return err
			}
		}

		// clean up .tmp files left behind by fileblob driver
		// see https://github.com/google/go-cloud/issues/3286 for original issue
		// and https://github.com/google/go-cloud/issues/3294 for why it's not truly fixed
		err := filepath.WalkDir(path, func(path string, d os.DirEntry, err error) error {
			if err != nil {
				return err
			}

			if !d.IsDir() && strings.HasSuffix(d.Name(), ".tmp") {
				err = os.Remove(path)
			}
			return err
		})
		if err != nil {
			log.Println("failed to clean up temp files: " + err.Error())
		}

		return nil
	case GS:
		// Check for gcloud cred env vars
		googleAppCredentials := os.Getenv(GOOGLE_APPLICATION_CREDENTIALS)

		if googleAppCredentials == "" {
			return errors.New("missing credentials required for persistent GS backing (i.e. GOOGLE_APPLICATION_CREDENTIALS)")
		}

		return nil
	case AZBLOB:
		azureStorageAccount := os.Getenv(AZURE_STORAGE_ACCOUNT)
		azureStorageKey := os.Getenv(AZURE_STORAGE_KEY)

		if azureStorageAccount == "" || azureStorageKey == "" {
			return errors.New("missing credentials required for persistent Azure backing (i.e. AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY)")
		}

		return nil
	case HTTP, S3:
		// https defaults to S3
		// solutions like Minio use https links for storage but use an S3 compatible API

		accessKey := os.Getenv(AWS_ACCESS_KEY_ID)
		secretKey := os.Getenv(AWS_SECRET_ACCESS_KEY)
		region := os.Getenv(AWS_REGION)

		if accessKey == "" || secretKey == "" || region == "" {
			return errors.New("missing credentials required for persistent S3 backing (i.e. AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY)")
		}

		// check for s3 env vars
		return nil
	}

	return errors.New("unknown presistent storage type")
}

func MoveAllFiles(from, to *blob.Bucket) error {
	ctx := context.Background()

	keys, err := getKeys(from, ctx)
	if err != nil {
		return fmt.Errorf("error listing keys in bucket to move files from: %v", err)
	}

	g, ctx := errgroup.WithContext(ctx)
	g.SetLimit(20)

	for _, key := range keys {
		k := key
		g.Go(func() error {
			return moveFile(from, to, k, ctx)
		})
	}

	if err := g.Wait(); err != nil {
		return fmt.Errorf("error moving files from old to new bucket: %v", err)
	}

	return nil
}

func getKeys(bucket *blob.Bucket, ctx context.Context) ([]string, error) {
	keys := []string{}
	iter := bucket.List(nil)
	for {
		obj, err := iter.Next(ctx)
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		// ignore .tmp files from old fileblob driver bug https://github.com/google/go-cloud/issues/3286
		if !strings.HasSuffix(obj.Key, ".tmp") {
			keys = append(keys, obj.Key)
		}
	}

	return keys, nil
}

func moveFile(from, to *blob.Bucket, key string, ctx context.Context) error {
	attrs, err := from.Attributes(ctx, key)
	if err != nil {
		return fmt.Errorf("error getting attributes for key %s: %v", key, err)
	}

	r, err := from.NewReader(ctx, key, nil)
	if err != nil {
		return fmt.Errorf("error getting reader for key %s: %v", key, err)
	}

	w, err := to.NewWriter(ctx, key, &blob.WriterOptions{
		ContentType: attrs.ContentType,
		ContentMD5:  attrs.MD5,
		Metadata:    attrs.Metadata,
	})
	if err != nil {
		r.Close()
		return fmt.Errorf("error getting writer for key %s: %v", key, err)
	}

	_, err = io.Copy(w, r)
	if err != nil {
		r.Close()
		return fmt.Errorf("error copying data for key %s: %v", key, err)
	}

	if err := w.Close(); err != nil {
		r.Close()
		return fmt.Errorf("error closing writer for key %s: %v", key, err)
	}

	r.Close()
	if err := from.Delete(ctx, key); err != nil {
		return fmt.Errorf("error deleting key %s from old bucket: %v", key, err)
	}

	return nil
}
