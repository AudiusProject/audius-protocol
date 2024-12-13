// anything related to accounts like signing, wallets, and serialization
// used by config, server, and sdk
package common

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"encoding/hex"
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
