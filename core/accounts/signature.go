package accounts

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"github.com/ethereum/go-ethereum/crypto"
)

func EthSign(pkey *ecdsa.PrivateKey, data []byte) (string, error) {
	dataHash := sha256.Sum256(data)

	signature, err := crypto.Sign(dataHash[:], pkey)
	if err != nil {
		return "", fmt.Errorf("failed to signed data: %v", err)
	}

	signatureStr := hex.EncodeToString(signature)
	return signatureStr, nil
}

func EthRecover(signatureStr string, data []byte) (*ecdsa.PublicKey, string, error) {
	signature, err := hex.DecodeString(signatureStr)
	if err != nil {
		return nil, "", fmt.Errorf("could not decode signature: %v", err)
	}

	dataHash := sha256.Sum256(data)

	pubKey, err := crypto.SigToPub(dataHash[:], signature)
	if err != nil {
		return nil, "", fmt.Errorf("could not recover pubkey: %v", err)
	}

	address := crypto.PubkeyToAddress(*pubKey).Hex()

	return pubKey, address, nil
}
