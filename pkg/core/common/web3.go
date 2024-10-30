package common

import (
	"crypto/ecdsa"

	"github.com/ethereum/go-ethereum/crypto"
)

func PrivKeyToAddress(privateKey *ecdsa.PrivateKey) (string, error) {
	publicKey := privateKey.Public().(*ecdsa.PublicKey)
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
