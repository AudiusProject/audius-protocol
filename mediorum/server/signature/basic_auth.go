package signature

import (
	"crypto/ecdsa"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/ethereum/go-ethereum/accounts"
	"github.com/ethereum/go-ethereum/crypto"
)

// From https://github.com/AudiusProject/sig/blob/main/go/index.go
func sign(input string, privateKey *ecdsa.PrivateKey) ([]byte, error) {
	// hash the input
	hash := crypto.Keccak256Hash([]byte(input))
	// TextHash will prepend Ethereum signed message prefix to the hash
	// and hash that again
	hash2 := accounts.TextHash(hash.Bytes())

	signature, err := crypto.Sign(hash2, privateKey)
	if err != nil {
		return nil, err
	}
	return signature, nil
}

// between mediorum servers, authenticate requests a basic auth
func basicAuthNonce(privateKey *ecdsa.PrivateKey) string {
	// for dev:
	if privateKey == nil {
		return "Basic " + base64.StdEncoding.EncodeToString([]byte("dev:mode"))
	}

	ts := fmt.Sprintf("%d", time.Now().UnixMilli())
	signature, err := sign(ts, privateKey)
	if err != nil {
		panic(err)
	}
	signatureHex := fmt.Sprintf("0x%s", hex.EncodeToString(signature))

	basic := ts + ":" + signatureHex
	return "Basic " + base64.StdEncoding.EncodeToString([]byte(basic))
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
