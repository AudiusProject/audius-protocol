package accounts

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"encoding/hex"

	"github.com/ethereum/go-ethereum/crypto"
)

func DeriveEthAddress(pubKey *ecdsa.PublicKey) string {
	pubKeyBytes := crypto.FromECDSAPub(pubKey)
	keccakHash := crypto.Keccak256(pubKeyBytes[1:])
	return hex.EncodeToString(keccakHash[12:])
}

func DeriveCometAddress(pubKey *ecdsa.PublicKey) string {
	pubKeyBytes := crypto.FromECDSAPub(pubKey)
	shaHash := sha256.Sum256(pubKeyBytes)
	return hex.EncodeToString(shaHash[:20])
}
