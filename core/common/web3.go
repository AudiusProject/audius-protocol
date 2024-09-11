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

// for parity with the web3.js web3.utils.utf8ToHex() call
func Utf8ToHex(s string) [32]byte {
	hex := [32]byte{}
	copy(hex[:], s)
	return hex
}

// reverse of Utf8ToHex
func HexToUtf8(hex [32]byte) string {
	var end int
	for end = range hex {
		if hex[end] == 0 {
			break
		}
	}
	return string(hex[:end])
}
