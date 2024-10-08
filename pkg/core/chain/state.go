package chain

import (
	"crypto/sha256"
)

func (app *CoreApplication) serializeAppState(prevHash []byte, txs [][]byte) []byte {
	var combinedHash []byte

	combinedHash = append(combinedHash, prevHash...)

	for _, tx := range txs {
		combinedHash = append(combinedHash, tx...)
	}

	newAppHashBytes := sha256.Sum256(combinedHash)
	return newAppHashBytes[:]
}
