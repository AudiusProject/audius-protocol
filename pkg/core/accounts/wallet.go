package accounts

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"fmt"

	"github.com/cometbft/cometbft/crypto/ed25519"
	"github.com/ethereum/go-ethereum/crypto"
)

func EthToCometKey(privateKey *ecdsa.PrivateKey) (*ed25519.PrivKey, error) {
	hash := sha256.Sum256(privateKey.D.Bytes())
	eckey := ed25519.GenPrivKeyFromSecret(hash[:])
	return &eckey, nil
}

func EthToEthKey(privKey string) (*ecdsa.PrivateKey, error) {
	privateKey, err := crypto.HexToECDSA(privKey)
	if err != nil {
		return nil, fmt.Errorf("could not convert string to privkey: %v", err)
	}
	if privateKey.Curve != crypto.S256() {
		return nil, fmt.Errorf("private key is not secp256k1 curve")
	}
	return privateKey, nil
}
