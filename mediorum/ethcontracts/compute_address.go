package ethcontracts

import (
	"crypto/ecdsa"
	"encoding/hex"

	"github.com/ethereum/go-ethereum/crypto"
)

func ParsePrivateKeyHex(pk string) (*ecdsa.PrivateKey, error) {
	privateBytes, err := hex.DecodeString(pk)
	if err != nil {
		return nil, err
	}
	return crypto.ToECDSA(privateBytes)
}

func ComputeAddressFromPrivateKey(privateKey *ecdsa.PrivateKey) string {
	return crypto.PubkeyToAddress(privateKey.PublicKey).Hex()
}
