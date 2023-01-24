package peering

import (
	"encoding/base64"
	"errors"
	"io"

	"comms.audius.co/discovery/config"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/labstack/echo/v4"
)

func ReadSignedRequest(c echo.Context) (payload []byte, wallet string, err error) {
	if c.Request().Method == "GET" {
		payload = []byte(c.Request().URL.Path)
	} else if c.Request().Method == "POST" {
		payload, err = io.ReadAll(c.Request().Body)
	} else {
		err = errors.New("unsupported request type")
	}
	if err != nil {
		return
	}

	sigHex := c.Request().Header.Get(config.SigHeader)
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
