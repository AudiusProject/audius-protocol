
package contentaccess

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
	"comms.audius.co/shared/utils"
)

type SignatureData struct {
	Cid string
	Timestamp int64
	TrackId int64
}

func recoverWallet(signatureData SignatureData, signature string) (string, error) {
	stringData, err := json.Marshal(signatureData)
	if err != nil {
		return "", err
	}

	hashData := crypto.Keccak256(stringData)
	recoveredSigner, err := crypto.Ecrecover(hashData, []byte(signature))
	if err != nil {
		return "", err
	}

	return string(recoveredSigner[:]), nil
}

func isExpired(signatureData SignatureData, signature string) bool {
	signatureTimestamp := time.Unix(signatureData.Timestamp, 0)
	currentTimestamp := time.Now()
	return currentTimestamp.Sub(signatureTimestamp) > 300_000
}

func isCidMatch(signatureData SignatureData, requestedCid string) bool {
	return signatureData.Cid == requestedCid
}

func VerifySignature(
	signatureData SignatureData,
	signature string,
	requestedCid string,
) (bool, error) {
	if (!isCidMatch(signatureData, requestedCid)) {
		return false, errors.New("Signed cid does not match requested cid.")
	}

	wallet, err := recoverWallet(signatureData, signature)
	if err != nil {
		return false, errors.New("Wallet recovery failed")
	}

	if (!IsValidDiscoveryNode(wallet)) {
		return false, errors.New("Signature is not from valid discovery node.")
	}

	if (isExpired(signatureData, signature)) {
		return false, errors.New("Signature has expired.")
	}

	return true, nil
}
