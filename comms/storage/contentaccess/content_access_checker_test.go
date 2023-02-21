package contentaccess

import (
	"crypto/ecdsa"
	"net/url"
	"testing"
	"time"

	"comms.audius.co/shared/utils"
)

const (
  dummyDNPrivateKey =
    "0x3873ed01bfb13621f9301487cc61326580614a5b99f3c33cf39c6f9da3a19cad"
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
		signature string
		expectedData SignatureData
		expectedSignature string
		shouldError bool
	}{
		{
			"",
			SignatureData{
			},
			"",
			false,
		},
	}

	for _, tt := range tests {
		privKey := ecdsa.PrivateKey(dummyDNPrivateKey);
		signature, err := utils.GenerateSignature(tt.signature, privKey)
		if err != nil {
			t.Fatalf("Failed to generate signature for %+v", tt.signature)
		}

		values := url.Values(map[string][]string{
			"signature": {string(signature)},
		})

		actualData, actualSignature, actualError := parseQueryParams(values)

		if *actualData != tt.expectedData {
			t.Fatalf("incorrect signature data, want=%+v, got=%+v", tt.expectedData, actualData)
		}

		if actualSignature != tt.expectedSignature {
			t.Fatalf("incorrect signature, want=%+v, got=%+v", tt.expectedSignature, actualSignature)
		}

		if (actualError != nil) == tt.shouldError {
			t.Fatalf("incorrect error, want=%+v, got=%+v", tt.shouldError, actualError)
		}
	}
}
