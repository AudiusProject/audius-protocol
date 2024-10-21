package accounts

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"

	"github.com/cometbft/cometbft/crypto/ed25519"
	"github.com/ethereum/go-ethereum/crypto"
)

func EthToCometKey(hexPkey string) (*ed25519.PrivKey, error) {
	ethPkeyBytes, err := hex.DecodeString(hexPkey)
	if err != nil {
		return nil, err
	}

	if len(ethPkeyBytes) != 32 {
		return nil, errors.New("private key length not 32")
	}

	hash := sha256.Sum256(ethPkeyBytes)
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
