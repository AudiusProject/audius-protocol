package accounts

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"

	"github.com/cometbft/cometbft/crypto/ed25519"
)

func EthToCometKey(hexPkey string) (ed25519.PrivKey, error) {
	ethPkeyBytes, err := hex.DecodeString(hexPkey)
	if err != nil {
		return nil, err
	}

	if len(ethPkeyBytes) != 32 {
		return nil, errors.New("private key length not 32")
	}

	hash := sha256.Sum256(ethPkeyBytes)
	eckey := ed25519.GenPrivKeyFromSecret(hash[:])
	return eckey, nil
}
