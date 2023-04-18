package signing

import (
	"crypto/ecdsa"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
)

// copy pasted from mediorum

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
