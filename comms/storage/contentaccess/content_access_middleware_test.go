package contentaccess

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"testing"
	"time"

	sharedConfig "comms.audius.co/shared/config"
	"comms.audius.co/shared/peering"
	"comms.audius.co/shared/utils"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/labstack/echo/v4"
	"github.com/nats-io/nats.go"
)

var dnodes []sharedConfig.ServiceNode

type mockpeering struct{}

func (mp *mockpeering) AllNodes() ([]sharedConfig.ServiceNode, error) {
	return nil, nil
}
func (mp *mockpeering) DialJetstream(peerMap map[string]*peering.Info) (nats.JetStreamContext, error) {
	return nil, nil
}
func (mp *mockpeering) DialNats(peerMap map[string]*peering.Info) (*nats.Conn, error) {
	return nil, nil
}
func (mp *mockpeering) DialNatsUrl(natsUrl string) (*nats.Conn, error) {
	return nil, nil
}
func (mp *mockpeering) ExchangeEndpoint(c echo.Context) error {
	return nil
}
func (mp *mockpeering) GetContentNodes() ([]sharedConfig.ServiceNode, error) {
	return nil, nil
}
func (mp *mockpeering) GetDiscoveryNodes() ([]sharedConfig.ServiceNode, error) {
	return dnodes, nil
}
func (mp *mockpeering) ListPeers() []peering.Info {
	return nil
}
func (mp *mockpeering) MyInfo() (*peering.Info, error) {
	return nil, nil
}
func (mp *mockpeering) NatsConnectionTest(natsUrl string) bool {
	return true
}
func (mp *mockpeering) PollRegisteredNodes() error {
	return nil
}
func (mp *mockpeering) PostSignedJSON(endpoint string, obj interface{}) (*http.Response, error) {
	return nil, nil
}
func (mp *mockpeering) Solicit() map[string]*peering.Info {
	return nil
}
func TestContentAccessMiddleware(t *testing.T) {
	mp := &mockpeering{}
	e := echo.New()
	e.HideBanner = true
	e.Debug = true

	e.GET("/stream/:CID", func(c echo.Context) error {
		return c.String(http.StatusOK, "Success")
	}, ContentAccessMiddleware(mp))

	go e.Start(":7000")

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

	dnodes = []sharedConfig.ServiceNode{correctDiscoveryNode}

	tests := map[string]struct {
		signedData   SignatureData
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
		"empty CID": {
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

	for _, tt := range tests {
		// make request
		marshalledSignatureData, err := json.Marshal(tt.signedData)
		if err != nil {
			t.Fatalf("could not marshal signed data, %+v", err)
		}

		marshalledAccessData, err := json.Marshal(SignedAccessData{
			Signature: tt.signature,
			Data:      marshalledSignatureData,
		})
		if err != nil {
			t.Fatalf("could not marshal signed access data, %+v", err)
		}

		signatureParam := url.QueryEscape(string(marshalledAccessData))
		req := fmt.Sprintf("http://localhost:7000/stream/%s?signature=%s",tt.requestedCid ,signatureParam)

		t.Log(req)
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
