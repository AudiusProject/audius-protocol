package peering

import (
	"encoding/base64"
	"errors"
	"io"

	"comms.audius.co/discovery/config"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/labstack/echo/v4"
)

func ReadSignedRequest(c echo.Context) ([]byte, string, error) {
	var payload []byte
	var err error
	if c.Request().Method == "GET" {
		payload = []byte(c.Request().URL.Path)
	} else if c.Request().Method == "POST" {
		payload, err = io.ReadAll(c.Request().Body)
	} else {
		err = errors.New("Unsupported request method " + c.Request().Method)
	}
	if (err != nil) {
		return nil, "", err
	}

	sigHex := c.Request().Header.Get(config.SigHeader)
	wallet, err := ReadSigned(sigHex, payload)
	return payload, wallet, err
}


func ReadSigned(signatureHex string, signedData []byte) (string, error) {
	sig, err := base64.StdEncoding.DecodeString(signatureHex)
	if err != nil {
		err = errors.New("bad sig header: " + err.Error())
		return "", err
	}

	// recover
	hash := crypto.Keccak256Hash(signedData)
	pubkey, err := crypto.SigToPub(hash[:], sig)
	if err != nil {
		return "", err
	}
	wallet := crypto.PubkeyToAddress(*pubkey).Hex()
	return wallet, nil
}