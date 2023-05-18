package signature

import (
	"crypto/ecdsa"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
)

// between mediorum servers, authenticate requests a basic auth
func basicAuthNonce(privateKey *ecdsa.PrivateKey) string {
	// for dev:
	if privateKey == nil {
		return "Basic " + base64.StdEncoding.EncodeToString([]byte("dev:mode"))
	}

	ts := fmt.Sprintf("%d", time.Now().UnixMilli())
	hash := crypto.Keccak256Hash([]byte(ts))
	signature, err := crypto.Sign(hash.Bytes(), privateKey)
	if err != nil {
		panic(err)
	}

	basic := ts + ":" + hex.EncodeToString(signature)
	basic2 := "Basic " + base64.StdEncoding.EncodeToString([]byte(basic))
	return basic2
}

func SignedGet(endpoint string, privateKey *ecdsa.PrivateKey) (*http.Request, error) {
	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Add("Authorization", basicAuthNonce(privateKey))

	return req, nil
}

func SignedPost(endpoint string, contentType string, r io.Reader, privateKey *ecdsa.PrivateKey) *http.Request {
	req, err := http.NewRequest("POST", endpoint, r)
	if err != nil {
		panic(err)
	}

	req.Header.Add("Content-Type", contentType)
	req.Header.Add("Authorization", basicAuthNonce(privateKey))

	return req
}
