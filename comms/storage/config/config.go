// Package config provides the configuration for the storage node by reading env vars.
package config

import (
	"errors"
	"os"
	"strings"

	shared "comms.audius.co/shared/config"
	"comms.audius.co/shared/utils"
	"golang.org/x/exp/slog"
)

const (
	AWS_ACCESS_KEY_ID     = "AWS_ACCESS_KEY_ID"
	AWS_SECRET_ACCESS_KEY = "AWS_SECRET_ACCESS_KEY"
	AWS_REGION            = "AWS_REGION"

	GOOGLE_APPLICATION_CREDENTIALS = "GOOGLE_APPLICATION_CREDENTIALS"

	AZURE_STORAGE_ACCOUNT = "AZURE_STORAGE_ACCOUNT"
	AZURE_STORAGE_KEY     = "AZURE_STORAGE_KEY"
)

type StorageDriverPrefix int

const (
	FILE StorageDriverPrefix = iota
	HTTP
	GS
	S3
	AZBLOB
)

var prefixWhitelist = map[string]StorageDriverPrefix{
	"file":   FILE,
	"http":   HTTP,
	"https":  HTTP,
	"gs":     GS,
	"s3":     S3,
	"azblob": AZBLOB,
}

type StorageConfig struct {
	PeeringConfig           shared.PeeringConfig `json:"peeringConfig"`
	StorageDriverUrl        string               `envconfig:"AUDIUS_STORAGE_DRIVER_URL" default:"file:///tmp/audius_storage" json:"storageDriverUrl"`
	ReportOKIntervalSeconds int                  `envconfig:"AUDIUS_REPORT_OK_INTERVAL_SECONDS" default:"120" json:"reportOkIntervalSeconds"`
	RebalanceIntervalHours  float64              `envconfig:"AUDIUS_REBALANCE_INTERVAL_HOURS" default:"24" json:"rebalanceIntervalHours"`
	HealthTTLHours          float64              `envconfig:"AUDIUS_HEALTH_TTL_HOURS" default:"24" json:"healthTtlHours"`
	ShardLength             int                  `envconfig:"AUDIUS_SHARD_LENGTH" default:"2" json:"shardLength"`
}

var storageConfig *StorageConfig

// GetStorageConfig returns the storage config by parsing env vars.
func GetStorageConfig() *StorageConfig {
	if storageConfig == nil {
		storageConfig = &StorageConfig{}
		shared.EnsurePrivKeyAndLoadConf(storageConfig)
		err := verifyStorageCredentials(storageConfig.StorageDriverUrl)
		if err != nil {
			slog.Error("failed to verify storage credentials", err)
			os.Exit(1)
		}
	}
	return storageConfig
}

func parseStorageDriverPrefix(rawPrefix string) (StorageDriverPrefix, bool) {
	prefix, ok := prefixWhitelist[rawPrefix]
	return prefix, ok
}

func verifyStorageCredentials(blobDriverUrl string) error {
	rawPrefix, uri, found := strings.Cut(blobDriverUrl, "://")

	prefix, ok := parseStorageDriverPrefix(rawPrefix)
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
		// HTTP and HTTPS default to S3.
		// Solutions like MinIO use HTTPS links for storage but use an S3 compatible API specified by the "endpoint" param in the storage driver URL

		accessKey := os.Getenv(AWS_ACCESS_KEY_ID)
		secretKey := os.Getenv(AWS_SECRET_ACCESS_KEY)
		region := os.Getenv(AWS_REGION)

		if strings.Contains(uri, "endpoint=") {
			slog.Info("Using custom 'endpoint' param in blobDriverURL for S3-compatible storage. This means you're using something like MinIO, Ceph, or SeaweedFS instead of S3.")
		} else if accessKey == "" || secretKey == "" || region == "" {
			return errors.New("missing credentials required for persistent S3 backing (i.e. AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY)")
		}

		return nil
	}

	return errors.New("unknown presistent storage type")
}
