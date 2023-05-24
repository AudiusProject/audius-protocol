package signing

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

// copy pasted from mediorum

func SignedPost(endpoint string, contentType string, r io.Reader, privateKey *ecdsa.PrivateKey) *http.Request {
	req, err := http.NewRequest("POST", endpoint, r)
	if err != nil {
		panic(err)
	}

	req.Header.Add("Content-Type", contentType)
	req.Header.Add("Authorization", BasicAuthNonce(privateKey))

	return req
}

func BasicAuthNonce(pk *ecdsa.PrivateKey) string {
	// for dev:
	if pk == nil {
		return "Basic " + base64.StdEncoding.EncodeToString([]byte("dev:mode"))
	}

	ts := fmt.Sprintf("%d", time.Now().UnixMilli())
	hash := crypto.Keccak256Hash([]byte(ts))
	signature, err := crypto.Sign(hash.Bytes(), pk)
	if err != nil {
		panic(err)
	}

	basic := ts + ":" + hex.EncodeToString(signature)
	basic2 := "Basic " + base64.StdEncoding.EncodeToString([]byte(basic))
	return basic2
}
