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

type SignatureData struct {
	Cid       string
	ShouldCache bool
	Timestamp int64
	TrackId   int64
}

func (sd SignatureData) toMap() map[string]interface{} {
	return map[string]interface{}{
		"cid": sd.Cid,
		"shouldCache": sd.ShouldCache,
		"timestamp": sd.Timestamp,
		"trackId": sd.TrackId,
	}
}

func recoverWallet(signatureData SignatureData, signature []byte) (string, error) {
	stringData, err := json.Marshal(signatureData.toMap())
	if err != nil {
		return "", err
	}

	hashData := crypto.Keccak256(stringData)
	recoveredSigner, err := crypto.Ecrecover(hashData, signature)
	if err != nil {
		return "", err
	}

	return string(recoveredSigner[:]), nil
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

	if !utils.IsValidDiscoveryNode(signer) {
		return false, errors.New("Signature is not from valid discovery node.")
	}

	if isExpired(signatureData) {
		return false, errors.New("Signature has expired.")
	}

	return true, nil
}
