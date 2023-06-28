package signing

import (
	"encoding/base64"
	"errors"
	"io"
	"strconv"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/labstack/echo/v4"
)

func ReadSignedRequest(c echo.Context) ([]byte, string, error) {
	var payload []byte
	var err error
	if c.Request().Method == "GET" {
		// Check that timestamp is not too old
		timestamp, err := strconv.ParseInt(c.QueryParam("timestamp"), 0, 64)
		if err != nil || time.Now().UnixMilli()-timestamp > SignatureTimeToLiveMs {
			return nil, "", errors.New("invalid timestamp")
		}

		// Strip out the app_name query parameter to get the true signature payload
		u := *c.Request().URL
		q := u.Query()
		q.Del("app_name")
		u.RawQuery = q.Encode()
		payload = []byte(u.String())
	} else if c.Request().Method == "POST" {
		payload, err = io.ReadAll(c.Request().Body)
	} else {
		err = errors.New("Unsupported request method " + c.Request().Method)
	}
	if err != nil {
		return nil, "", err
	}

	sigHex := c.Request().Header.Get(SigHeader)
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
