package accounts

import (
	"crypto/ecdsa"
	"encoding/hex"

	"github.com/ethereum/go-ethereum/crypto"
)

func SerializePublicKey(pubKey *ecdsa.PublicKey) (string, error) {
	bytes := crypto.CompressPubkey(pubKey)
	encoded := hex.EncodeToString(bytes)
	return encoded, nil
}

func DeserializePublicKey(encoded string) (*ecdsa.PublicKey, error) {
	bytes, err := hex.DecodeString(encoded)
	if err != nil {
		return nil, err
	}

	pubKey, err := crypto.DecompressPubkey(bytes)
	if err != nil {
		return nil, err
	}

	return pubKey, nil
}
