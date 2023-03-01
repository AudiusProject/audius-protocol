package tests

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/labstack/echo/v4"

	sharedConfig "comms.audius.co/shared/config"
	"comms.audius.co/shared/utils"
	"comms.audius.co/storage/contentaccess"
)

func TestContentAccessMiddleware(t *testing.T) {
	mp := &MockPeering{}
	e := echo.New()
	e.HideBanner = true
	e.Debug = true

	e.GET("/stream/:CID", func(c echo.Context) error {
		return c.String(http.StatusOK, "Success")
	}, contentaccess.ContentAccessMiddleware(mp))

	go e.Start(":7000")

	correctCID := "Qmblah"

	correctSignatureData := contentaccess.SignatureData{
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

	correctDiscoveryNode := sharedConfig.ServiceNode{
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

	mp.AddNode(correctDiscoveryNode)

	tests := map[string]struct {
		signedData   contentaccess.SignatureData
		signature    []byte
		requestedCid string
		statusCode   int
	}{
		"happy path": {
			correctSignatureData,
			correctSignature,
			correctCID,
			http.StatusOK,
		},
		"incorrect CID": {
			correctSignatureData,
			correctSignature,
			"whoa",
			echo.ErrBadRequest.Code,
		},
		"incorrect wallet": {
			correctSignatureData,
			[]byte("0xincorrectsignature"),
			correctCID,
			echo.ErrBadRequest.Code,
		},
	}

	for testName, tt := range tests {
		// make request
		marshalledSignatureData, err := json.Marshal(tt.signedData)
		if err != nil {
			t.Fatalf("could not marshal signed data, %+v", err)
		}

		marshalledAccessData, err := json.Marshal(contentaccess.SignedAccessData{
			Signature: tt.signature,
			Data:      marshalledSignatureData,
		})
		if err != nil {
			t.Fatalf("could not marshal signed access data, %+v", err)
		}

		signatureParam := url.QueryEscape(string(marshalledAccessData))
		req := fmt.Sprintf("http://localhost:7000/stream/%s?signature=%s", tt.requestedCid, signatureParam)

		t.Log(testName, req)
		resp, err := http.Get(req)
		if err != nil {
			t.Fatalf("http request failed, %+v", err)
		}

		// check response
		if resp.StatusCode != tt.statusCode {
			t.Fatalf("status code doesn't match up, want=%d, got=%d", tt.statusCode, resp.StatusCode)
		}

	}

	if err := e.Shutdown(context.Background()); err != nil {
		t.Fatalf("failed to shutdown server, %+v", err)
	}
}
