package accounts

import (
	"encoding/hex"
	"errors"

	"github.com/cometbft/cometbft/crypto/secp256k1"
)

func ToPrivateKey(hexPkey string) (secp256k1.PrivKey, error) {
	ethPkeyBytes, err := hex.DecodeString(hexPkey)
	if err != nil {
		return nil, err
	}

	if len(ethPkeyBytes) != 32 {
		return nil, errors.New("private key length not 32")
	}

	var cmPkey secp256k1.PrivKey
	copy(cmPkey[:], ethPkeyBytes)

	return cmPkey, nil
}
