package misc

import (
	"encoding/base64"
	"errors"

	"github.com/ethereum/go-ethereum/crypto"
)

// todo: de-duplicate from server.go
func RecoverWallet(payload []byte, sigHex string) (wallet string, err error) {
	// sig, err := hexutil.Decode(sigHex)
	sig, err := base64.StdEncoding.DecodeString(sigHex)

	if err != nil {
		err = errors.New("bad sig header: " + err.Error())
		return
	}

	// recover
	hash := crypto.Keccak256Hash(payload)
	pubkey, err := crypto.SigToPub(hash[:], sig)
	if err != nil {
		return
	}
	wallet = crypto.PubkeyToAddress(*pubkey).Hex()
	return
}
