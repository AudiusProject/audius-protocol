package persistence

import (
	"os"
	"testing"
)

func TestParsePrefix(t *testing.T) {
	tests := []struct {
		input          string
		expectedPrefix Prefix
		expectedOk     bool
	}{
		{
			input:          "file",
			expectedPrefix: FILE,
			expectedOk:     true,
		},
		{
			input:          "http",
			expectedPrefix: HTTP,
			expectedOk:     true,
		},
		{
			input:          "https",
			expectedPrefix: HTTP,
			expectedOk:     true,
		},
		{
			input:          "gcs",
			expectedPrefix: GCS,
			expectedOk:     true,
		},
		{
			input:          "s3",
			expectedPrefix: S3,
			expectedOk:     true,
		},
		{
			input:          "azblob",
			expectedPrefix: AZBLOB,
			expectedOk:     true,
		},
		{
			input:          "s4",
			expectedPrefix: 0,
			expectedOk:     false,
		},
	}

	for _, tt := range tests {
		actual, ok := parsePrefix(tt.input)

		if ok != tt.expectedOk {
			t.Fatalf("`%s` failed unexpectedly and isn't a valid Prefix", tt.input)
		}

		if actual != tt.expectedPrefix {
			t.Fatalf("`%s` did not parse correctly, want=%d, got=%d", tt.input, tt.expectedPrefix, actual)
		}
	}
}

func TestCheckStorageCredentials(t *testing.T) {

	tests := []struct {
		url           string
		envVars       map[string]string
		expectedError bool
	}{
		{
			url:           "file:///tmp/blah",
			envVars:       map[string]string{},
			expectedError: false,
		},
		{
			url:           "s3://my-bucket?region=us-east-1",
			envVars:       map[string]string{},
			expectedError: true,
		},
		{
			url: "s3://my-bucket?region=us-east-1",
			envVars: map[string]string{
				AWS_ACCESS_KEY_ID:     "SOMETHING",
				AWS_SECRET_ACCESS_KEY: "",
				AWS_REGION:            "",
			},
			expectedError: true,
		},
		{
			url: "s3://my-bucket?region=us-east-1",
			envVars: map[string]string{
				AWS_ACCESS_KEY_ID:     "KEY",
				AWS_SECRET_ACCESS_KEY: "SECRET",
				AWS_REGION:            "us-east-1",
			},
			expectedError: false,
		},
		{
			url: "https://s3.amazon.com/my-bucket?region=us-east-1",
			envVars: map[string]string{
				AWS_ACCESS_KEY_ID:     "KEY",
				AWS_SECRET_ACCESS_KEY: "SECRET",
				AWS_REGION:            "us-east-1",
			},
			expectedError: false,
		},
		{
			url: "gcs://my-bucket",
			envVars: map[string]string{
				GOOGLE_APPLICATION_CREDENTIALS: "",
			},
			expectedError: true,
		},
		{
			url: "gcs://my-bucket",
			envVars: map[string]string{
				GOOGLE_APPLICATION_CREDENTIALS: "/the/path/to/thing.json",
			},
			expectedError: false,
		},
		{
			url: "azblob://my-container",
			envVars: map[string]string{
				AZURE_CLIENT_ID:     "",
				AZURE_CLIENT_SECRET: "",
				AZURE_TENANT_ID:     "",
			},
			expectedError: true,
		},
		{
			url: "azblob://my-container",
			envVars: map[string]string{
				AZURE_CLIENT_ID:     "ID",
				AZURE_CLIENT_SECRET: "",
				AZURE_TENANT_ID:     "",
			},
			expectedError: true,
		},
		{
			url: "azblob://my-container",
			envVars: map[string]string{
				AZURE_CLIENT_ID:     "ID",
				AZURE_CLIENT_SECRET: "SECRET",
				AZURE_TENANT_ID:     "",
			},
			expectedError: true,
		},
		{
			url: "azblob://my-container",
			envVars: map[string]string{
				AZURE_CLIENT_ID:     "ID",
				AZURE_CLIENT_SECRET: "SECRET",
				AZURE_TENANT_ID:     "TENANT",
			},
			expectedError: false,
		},
	}

	for _, tt := range tests {
		for key, value := range tt.envVars {
			os.Setenv(key, value)
		}

		actual := checkStorageCredentials(tt.url)
		if (actual == nil) == tt.expectedError {
			t.Fatalf("`%s` didn't check creds correctly with these env vars %+v, got error=%+v", tt.url, tt.envVars, actual)
		}

		for key := range tt.envVars {
			os.Setenv(key, "")
		}
	}
}
