package contentaccess

import (
	"bytes"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/url"
	"testing"
	"time"

	"comms.audius.co/shared/config"
	"comms.audius.co/shared/utils"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/google/go-cmp/cmp"
)

func TestRecoverWallet(t *testing.T) {
	signatureData := SignatureData{
		Cid:         "Qmblah",
		ShouldCache: true,
		Timestamp:   time.Now().Unix(),
		TrackId:     12345,
	}

	privKey, err := crypto.GenerateKey()
	if err != nil {
		t.Fatal("Key generation failed")
	}
	signature, err := utils.GenerateSignature(signatureData, privKey)
	if err != nil {
		t.Fatalf("Failed to generate signature for %+v", signatureData)
	}
	expectedAddress := crypto.PubkeyToAddress(privKey.PublicKey).Hex()

	actualAddress, err := recoverWallet(signatureData, signature)
	if err != nil {
		t.Fatalf("recover wallet errored with %+v", err)
	}

	if actualAddress != expectedAddress {
		t.Fatalf("public key doesn't match signer, want=%+v, got=%+v", expectedAddress, actualAddress)
	}
}

func TestIsExpired(t *testing.T) {
	tests := []struct {
		data    SignatureData
		expired bool
	}{
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
	tests := []struct {
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

	correctCID := "Qmblah"

	correctSignatureData := SignatureData{
		Cid:         correctCID,
		ShouldCache: true,
		Timestamp:   time.Now().Unix(),
		TrackId:     12345,
	}

	privKey, err := crypto.GenerateKey()
	if err != nil {
		t.Fatal("Key generation failed")
	}
	correctSignature, err := utils.GenerateSignature(correctSignatureData, privKey)
	if err != nil {
		t.Fatalf("Failed to generate signature for %+v", correctSignatureData)
	}
	expectedWallet := crypto.PubkeyToAddress(privKey.PublicKey).Hex()

	correctDiscoveryNode := config.ServiceNode{
		ID:                  "blah",
		SPID:                "1",
		Endpoint:            "http://node1.com",
		DelegateOwnerWallet: expectedWallet,
		Type: struct {
			ID string "json:\"id\""
		}{
			ID: "discovery-node",
		},
	}

	tests := map[string]struct {
		dnodes         []config.ServiceNode
		signatureData  SignatureData
		signature      []byte
		requestedCid   string
		expectedResult error
	}{
		"incorrect CID": {
			[]config.ServiceNode{},
			SignatureData{
				Cid: "NotTheSame",
			},
			[]byte{},
			"Qmblahblah",
			errors.New("signed cid does not match requested cid"),
		},
		"incorrect wallet": {
			[]config.ServiceNode{
				correctDiscoveryNode,
			},
			correctSignatureData,
			[]byte("0xincorrectsignature"),
			correctCID,
			errors.New("wallet recovery failed"),
		},
		"happy path": {
			[]config.ServiceNode{
				correctDiscoveryNode,
			},
			correctSignatureData,
			correctSignature,
			correctCID,
			nil,
		},
	}

	for testName, tt := range tests {
		actualResult := VerifySignature(tt.dnodes, tt.signatureData, tt.signature, tt.requestedCid)

		if actualResult != tt.expectedResult && actualResult.Error() != tt.expectedResult.Error() {
			t.Fatalf("incorrect result for `%s`, want=%+v, got=%+v", testName, tt.expectedResult, actualResult)
		}
	}
}

func TestParseQueryParams(t *testing.T) {
	tests := []struct {
		testData SignatureData
	}{
		{
			SignatureData{
				Cid:         "Qmblah",
				ShouldCache: true,
				Timestamp:   time.Now().Unix(),
				TrackId:     12345,
			},
		},
		{
			SignatureData{
				ShouldCache: true,
				Timestamp:   time.Now().Unix(),
				TrackId:     12345,
			},
		},
	}

	privKey, err := crypto.GenerateKey()
	if err != nil {
		t.Fatal("Key generation failed")
	}

	for _, tt := range tests {
		rawSignature, err := utils.GenerateSignature(tt.testData, privKey)
		if err != nil {
			t.Fatalf("Failed to generate signature for %+v", tt.testData)
		}

		marshalledData, err := json.Marshal(tt.testData)
		if err != nil {
			t.Fatal("marshalling signature data failed")
		}

		signature := hex.EncodeToString(rawSignature)
		marshalledPayload, err := json.Marshal(SignedAccessData{
			Signature: signature,
			Data:      marshalledData,
		})
		if err != nil {
			t.Fatal("marshalling signature payload failed")
		}

		values := url.Values(map[string][]string{
			"signature": {url.QueryEscape(string(marshalledPayload))},
		})

		actualData, actualSignature, err := parseQueryParams(values)
		if err != nil {
			t.Fatalf("parse query error, got=%+v", err)
		}

		if actualData == nil || !cmp.Equal(*actualData, tt.testData) {
			t.Fatalf("incorrect signature data, want=%+v, got=%+v", tt.testData, actualData)
		}

		if !bytes.Equal(actualSignature, rawSignature) {
			t.Fatalf("incorrect signature, got (length=%d), want (length=%d)", len(signature), len(actualSignature))
		}

	}
}
