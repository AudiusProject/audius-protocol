package accounts

import (
	"crypto/ecdsa"
	"encoding/hex"
	"errors"
	"fmt"

	"github.com/cometbft/cometbft/crypto/secp256k1"
	"github.com/cometbft/cometbft/p2p"
	"github.com/cometbft/cometbft/privval"
	"github.com/ethereum/go-ethereum/crypto"
)

// key struct with both
type Key struct {
	secp256k1.PrivKey
	ecdsa.PrivateKey
}

func NewKey(hexPkey string) (*Key, error) {
	cometKey, err := EthToCometKey(hexPkey)
	if err != nil {
		return nil, err
	}

	ethKey, err := CometToEthKey(cometKey)
	if err != nil {
		return nil, err
	}

	return &Key{
		cometKey,
		*ethKey,
	}, nil
}

func LoadKey(filePath string) (*Key, error) {
	nodeKey, err := p2p.LoadNodeKey(filePath)
	if err != nil {
		return nil, err
	}

	cometPrivKey, ok := nodeKey.PrivKey.(secp256k1.PrivKey)
	if !ok {
		return nil, errors.New("loaded key not secp256k1")
	}

	ethPrivKey, err := CometToEthKey(nodeKey.PrivKey.Bytes())
	if err != nil {
		return nil, err
	}

	return &Key{
		cometPrivKey,
		*ethPrivKey,
	}, nil
}

func (k *Key) SaveValidatorAs(filePath string) error {
	pv := privval.NewFilePV(k.PrivKey, filePath, "")
	pv.Save()
	return nil
}

func (k *Key) SaveAs(filePath string) error {
	nodeKey := &p2p.NodeKey{
		PrivKey: k.PrivKey,
	}

	return nodeKey.SaveAs(filePath)
}

func (k *Key) EthAddress() string {
	return crypto.PubkeyToAddress(k.PrivateKey.PublicKey).Hex()
}

func EthToCometKey(hexPkey string) (secp256k1.PrivKey, error) {
	ethPkeyBytes, err := hex.DecodeString(hexPkey)
	if err != nil {
		return nil, err
	}

	if len(ethPkeyBytes) != 32 {
		return nil, errors.New("private key length not 32")
	}

	cmPkey := secp256k1.PrivKey(ethPkeyBytes)

	return cmPkey, nil
}

func CometToEthKey(key secp256k1.PrivKey) (*ecdsa.PrivateKey, error) {
	if len(key) != 32 {
		return nil, fmt.Errorf("invalid private key length: %v", len(key))
	}

	privKeyECDSA, err := crypto.ToECDSA(key[:])
	if err != nil {
		return nil, fmt.Errorf("failed to convert to ECDSA private key: %v", err)
	}

	return privKeyECDSA, nil
}
