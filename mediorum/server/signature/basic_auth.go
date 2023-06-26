package signature

import (
	"crypto/ecdsa"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"time"
)

// between mediorum servers, authenticate requests a basic auth
func basicAuthNonce(privateKey *ecdsa.PrivateKey) string {
	// for dev:
	if privateKey == nil {
		return "Basic " + base64.StdEncoding.EncodeToString([]byte("dev:mode"))
	}

	ts := fmt.Sprintf("%d", time.Now().UnixMilli())
	signature, err := Sign(ts, privateKey)
	if err != nil {
		panic(err)
	}
	signatureHex := fmt.Sprintf("0x%s", hex.EncodeToString(signature))

	basic := ts + ":" + signatureHex
	return "Basic " + base64.StdEncoding.EncodeToString([]byte(basic))
}

func SignedGet(endpoint string, privateKey *ecdsa.PrivateKey, selfHost string) (*http.Request, error) {
	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Add("Authorization", basicAuthNonce(privateKey))
	req.Header.Set("User-Agent", "mediorum "+selfHost)

	return req, nil
}

func SignedPost(endpoint string, contentType string, r io.Reader, privateKey *ecdsa.PrivateKey, selfHost string) *http.Request {
	req, err := http.NewRequest("POST", endpoint, r)
	if err != nil {
		panic(err)
	}

	req.Header.Add("Content-Type", contentType)
	req.Header.Add("Authorization", basicAuthNonce(privateKey))
	req.Header.Set("User-Agent", "mediorum "+selfHost)

	return req
}
