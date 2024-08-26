package common

import (
	"crypto/ecdsa"
	"encoding/hex"

	"github.com/ethereum/go-ethereum/crypto"
)

func PrivKeyHexToAddress(hexPrivateKey string) (string, error) {
	privateKeyBytes, err := hex.DecodeString(hexPrivateKey)
	if err != nil {
		return "", err
	}

	// Parse the private key
	privateKey, err := crypto.ToECDSA(privateKeyBytes)
	if err != nil {
		return "", err
	}

	// Get the public key from the private key
	publicKey := privateKey.Public().(*ecdsa.PublicKey)

	// Derive the Ethereum address from the public key
	address := crypto.PubkeyToAddress(*publicKey).Hex()
	return address, nil
}
