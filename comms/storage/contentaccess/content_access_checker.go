package contentaccess

import (
	"encoding/json"
	"errors"
	"time"

	"comms.audius.co/shared/utils"
	"github.com/ethereum/go-ethereum/crypto"
)

const (
	EXPIRATION_TIME = 300_000
)

type SignedAccessData struct {
	Signature []byte          `json:"signature"`
	Data      json.RawMessage `json:"data"`
}

type SignatureData struct {
	Cid         string `json:"cid"`
	ShouldCache bool   `json:"shouldCache"`
	Timestamp   int64  `json:"timestamp"`
	TrackId     int64  `json:"trackId"`
}

func (sd SignatureData) toMap() map[string]interface{} {
	return map[string]interface{}{
		"cid":         sd.Cid,
		"shouldCache": sd.ShouldCache,
		"timestamp":   sd.Timestamp,
		"trackId":     sd.TrackId,
	}
}

func recoverWallet(signatureData SignatureData, signature []byte) ([]byte, error) {
	stringData, err := json.Marshal(signatureData)
	if err != nil {
		return nil, err
	}

	hashData := crypto.Keccak256(stringData)
	recoveredSigner, err := crypto.Ecrecover(hashData, signature)
	if err != nil {
		return nil, err
	}

	return recoveredSigner, nil
}

func isExpired(signatureData SignatureData) bool {
	currentTimestamp := time.Now().Unix()
	return (currentTimestamp - signatureData.Timestamp) > EXPIRATION_TIME
}

func isCidMatch(signatureData SignatureData, requestedCid string) bool {
	return signatureData.Cid == requestedCid
}

func VerifySignature(
	signatureData SignatureData,
	signature []byte,
	requestedCid string,
) (bool, error) {
	if !isCidMatch(signatureData, requestedCid) {
		return false, errors.New("Signed cid does not match requested cid.")
	}

	signer, err := recoverWallet(signatureData, signature)
	if err != nil {
		return false, errors.New("Wallet recovery failed")
	}

	if !utils.IsValidDiscoveryNode(string(signer)) {
		return false, errors.New("Signature is not from valid discovery node.")
	}

	if isExpired(signatureData) {
		return false, errors.New("Signature has expired.")
	}

	return true, nil
}
