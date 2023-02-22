package contentaccess

import (
	"bytes"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/json"
	"net/url"
	"testing"
	"time"

	"comms.audius.co/shared/utils"
	"github.com/google/go-cmp/cmp"
)

const (
  badDNPrivateKey =
    "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  dummyDNDelegateOwnerWallet =
    "0x1D9c77BcfBfa66D37390BF2335f0140979a6122B"
)

func TestRecoverWallet(t *testing.T) {

}

func TestIsExpired(t *testing.T) {
	tests := []struct{
		data SignatureData
		expired bool
	} {
		{SignatureData{Timestamp: time.Now().Unix()}, false},
		{SignatureData{Timestamp: 0}, true},
	}

	for _, tt := range tests {
		actual := isExpired(tt.data)

		if actual != tt.expired {
			t.Fatalf("is expired failed for %+v, want=%+v, got=%+v", tt.data, tt.expired, actual)
		}
	}
}

func TestIsCidMatch(t *testing.T) {
	tests := []struct{
		data     SignatureData
		cid      string
		expected bool
	}{
		{SignatureData{Cid: "Qmblah"}, "Qmblah", true},
		{SignatureData{Cid: "Qmblah"}, "blah", false},
		{SignatureData{Cid: ""}, "blah", false},
		{SignatureData{Cid: "Qmblah"}, "", false},
	}

	for _, tt := range tests {
		actual := isCidMatch(tt.data, tt.cid)

		if actual != tt.expected {
			t.Fatalf("cid match failed for %+v, want=%+v, got=%+v", tt.cid, tt.expected, actual)
		}
	}
}

func TestVerifySignature(t *testing.T) {

}

func TestParseQueryParams(t *testing.T) {
	tests := []struct{
		testData SignatureData
		// testData string
		shouldError bool
	}{
		{
			SignatureData{
				Cid: "Qmblah",
				ShouldCache: true,
				Timestamp: time.Now().Unix(),
				TrackId: 12345,
			},
			false,
		},
		{
			SignatureData{
				ShouldCache: true,
				Timestamp: time.Now().Unix(),
				TrackId: 12345,
			},
			true,
		},
		{
			SignatureData{
				Cid: "Qmblah",
				Timestamp: time.Now().Unix(),
				TrackId: 12345,
			},
			true,
		},
		{
			SignatureData{
				Cid: "Qmblah",
				ShouldCache: true,
				TrackId: 12345,
			},
			true,
		},
		{
			SignatureData{
				Cid: "Qmblah",
				ShouldCache: true,
				Timestamp: time.Now().Unix(),
			},
			true,
		},
	}

	privKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal("Key generation failed")
	}


	for _, tt := range tests {
		signature, err := utils.GenerateSignature(tt.testData.toMap(), privKey)
		if err != nil {
			t.Fatalf("Failed to generate signature for %+v", tt.testData)
		}

		marshalledData, err := json.Marshal(tt.testData.toMap())
		if err != nil {
			t.Fatal("marshalling signature data failed")
		}

		marshalledPayload, err := json.Marshal(map[string][]byte{
			"signature": signature,
			"data": marshalledData,
		})	
		if err != nil {
			t.Fatal("marshalling signature payload failed")
		}

		values := url.Values(map[string][]string{
			"signature": {url.QueryEscape(string(marshalledPayload))},
		})

		actualData, actualSignature, actualError := parseQueryParams(values)
		didError := actualError != nil
		if didError != tt.shouldError {
			t.Fatalf("incorrect error, want=%+v, got=%+v", tt.shouldError, actualError)
		}

		if actualData == nil || !cmp.Equal(*actualData, tt.testData) {
			t.Fatalf("incorrect signature data, want=%+v, got=%+v", tt.testData, actualData)
		}

		if !bytes.Equal(actualSignature, signature) {
			t.Fatalf("incorrect signature, got (length=%d), want (length=%d)", len(signature), len(actualSignature))
		}

	}
}
