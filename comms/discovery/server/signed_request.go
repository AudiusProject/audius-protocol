package server

import (
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"strconv"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/db/queries"
	"comms.audius.co/shared/signing"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/labstack/echo/v4"
)

func userIdForSignedGet(c echo.Context) (int32, error) {
	if c.Request().Method != "GET" {
		return 0, errors.New("readSignedGet: bad method: " + c.Request().Method)
	}

	// Check that timestamp is not too old
	timestamp, err := strconv.ParseInt(c.QueryParam("timestamp"), 0, 64)
	if err != nil || time.Now().UnixMilli()-timestamp > signing.SignatureTimeToLiveMs {
		return 0, errors.New("invalid timestamp")
	}

	sigHex := c.Request().Header.Get(signing.SigHeader)

	// for websocket request, read from query param instead of header
	if querySig := c.QueryParam("signature"); sigHex == "" && querySig != "" {
		sigHex = querySig
	}

	// Strip out the app_name query parameter to get the true signature payload
	u := *c.Request().URL
	q := u.Query()
	q.Del("app_name")
	q.Del("signature")
	u.RawQuery = q.Encode()
	payload := []byte(u.String())

	wallet, err := recoverSigningWallet(sigHex, payload)
	if err != nil {
		return 0, errors.New("failed to recoverSigningWallet")
	}

	userId, err := queries.GetUserIDFromWallet(db.Conn, c.Request().Context(), wallet, c.QueryParam("current_user_id"))
	if err != nil {
		return 0, fmt.Errorf("failed to get user_id for wallet: %s", wallet)
	}

	return userId, err
}

func readSignedPost(c echo.Context) ([]byte, string, error) {
	if c.Request().Method != "POST" {
		return nil, "", errors.New("readSignedPost bad method: " + c.Request().Method)
	}

	payload, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return nil, "", err
	}

	sigHex := c.Request().Header.Get(signing.SigHeader)
	wallet, err := recoverSigningWallet(sigHex, payload)
	return payload, wallet, err
}

func recoverSigningWallet(signatureHex string, signedData []byte) (string, error) {
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
