package contentaccess

import (
	"encoding/json"
	"errors"
	"time"

	"comms.audius.co/shared/config"
	"comms.audius.co/shared/utils"
	"github.com/ethereum/go-ethereum/crypto"
)

const (
	EXPIRATION_TIME = 300_000
)

type SignedAccessData struct {
	Signature string          `json:"signature"`
	Data      json.RawMessage `json:"data"`
}

type SignatureData struct {
	Cid         string `json:"cid"`
	ShouldCache bool   `json:"shouldCache"`
	Timestamp   int64  `json:"timestamp"`
	TrackId     int64  `json:"trackId"`
}

func recoverWallet(signatureData SignatureData, signature []byte) (string, error) {
	stringData, err := json.Marshal(signatureData)
	if err != nil {
		return "", err
	}

	hashData := crypto.Keccak256(stringData)
	recoveredSigner, err := crypto.Ecrecover(hashData, signature)
	if err != nil {
		return "", err
	}

	recoveredPublicKey, err := crypto.UnmarshalPubkey(recoveredSigner)
	if err != nil {
		return "", err
	}

	recoveredAddress := crypto.PubkeyToAddress(*recoveredPublicKey).Hex()

	return recoveredAddress, nil
}

func isExpired(signatureData SignatureData) bool {
	currentTimestamp := time.Now().Unix()
	return (currentTimestamp - signatureData.Timestamp) > EXPIRATION_TIME
}

func isCidMatch(signatureData SignatureData, requestedCid string) bool {
	return signatureData.Cid == requestedCid
}

func VerifySignature(
	dnodes []config.ServiceNode,
	signatureData SignatureData,
	signature []byte,
	requestedCid string,
) error {
	if !isCidMatch(signatureData, requestedCid) {
		return errors.New("signed cid does not match requested cid")
	}

	signer, err := recoverWallet(signatureData, signature)
	if err != nil {
		return errors.New("wallet recovery failed")
	}

	if !utils.IsValidDiscoveryNode(dnodes, string(signer)) {
		return errors.New("signature is not from valid discovery node")
	}

	if isExpired(signatureData) {
		return errors.New("signature has expired")
	}

	return nil
}
