package components

import (
	"crypto/sha256"
	"encoding/hex"
)

func (c *Components) ToTxHash(tx []byte) string {
	hash := sha256.Sum256(tx)
	return hex.EncodeToString(hash[:])
}
