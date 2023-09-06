package server

import (
	"bytes"
	"encoding/hex"
	"fmt"
	"io"
	"mediorum/server/signature"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/gowebpki/jcs"
	"github.com/labstack/echo/v4"
	"github.com/storyicon/sigverify"
)

// From https://github.com/AudiusProject/sig/blob/main/go/index.go
func recover(input string, signature []byte) (common.Address, error) {
	hash := crypto.Keccak256Hash([]byte(input))
	return sigverify.EcRecoverEx(hash.Bytes(), signature)
}

func (ss *MediorumServer) checkBasicAuth(user, pass string, c echo.Context) (bool, error) {
	// for dev:
	if ss.Config.privateKey == nil {
		return true, nil
	}

	// check age
	ts, err := strconv.ParseInt(user, 0, 64)
	if err != nil {
		return false, echo.NewHTTPError(http.StatusBadRequest, "basic auth: invalid ts", err)
	}
	if age := time.Since(time.UnixMilli(ts)); age > time.Hour {
		return false, echo.NewHTTPError(http.StatusBadRequest, "basic auth: ts too old")
	}

	// recover
	sig, err := hex.DecodeString(pass[2:]) // remove "0x"
	if err != nil {
		return false, echo.NewHTTPError(http.StatusBadRequest, "basic auth: signature not hex", err)
	}
	wallet, err := recover(user, sig)
	if err != nil {
		return false, echo.NewHTTPError(http.StatusBadRequest, "basic auth: invalid signature", err)
	}

	// check peer list for wallet
	for _, peer := range ss.Config.Peers {
		if strings.EqualFold(peer.Wallet, wallet.Hex()) {
			return true, nil
		}
	}

	return false, echo.NewHTTPError(http.StatusBadRequest, "basic auth: wallet not in peer list "+wallet.Hex())

}

func (ss *MediorumServer) requireUserSignature(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// id is the upload ID
		id := c.Param("id")
		sig, err := signature.ParseFromQueryString(c.QueryParam("signature"))
		if err != nil {
			return c.JSON(401, map[string]string{
				"error":  "invalid signature",
				"detail": err.Error(),
			})
		} else {
			// check it is for this upload id
			if sig.Data.UploadID != id {
				return c.JSON(401, map[string]string{
					"error":  "signature contains incorrect ID",
					"detail": fmt.Sprintf("url: %s, signature %s", id, sig.Data.UploadID),
				})
			}

			// check signature not too old
			age := time.Since(time.Unix(sig.Data.Timestamp/1000, 0))
			if age > (time.Hour * 48) {
				return c.JSON(401, map[string]string{
					"error":  "signature too old",
					"detail": age.String(),
				})
			}

			// OK
			c.Response().Header().Set("x-signature-debug", sig.String())
			c.Set("signer-wallet", sig.SignerWallet)
		}

		return next(c)
	}
}

func (ss *MediorumServer) requireBodySignedByOwner(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		sig, err := signature.ParseFromQueryString(c.QueryParam("signature"))
		if err != nil {
			return c.JSON(401, map[string]string{
				"error":  "invalid signature",
				"detail": err.Error(),
			})
		}

		// hash the body of the POST request
		bodyBytes, err := io.ReadAll(c.Request().Body)
		if err != nil {
			return c.JSON(401, map[string]string{
				"error":  "failed to read POST body bytes",
				"detail": err.Error(),
			})
		}
		c.Request().Body = io.NopCloser(bytes.NewBuffer(bodyBytes)) // reset body so it can be read again later
		bodyBytesSorted, err := jcs.Transform(bodyBytes)
		if err != nil {
			return c.JSON(401, map[string]string{
				"error":  "failed to sort POST body bytes",
				"detail": err.Error(),
			})
		}
		bodyHash := crypto.Keccak256Hash(bodyBytesSorted)

		// check signature data is for this request body
		if !bytes.Equal(bodyHash.Bytes(), sig.DataHash.Bytes()) {
			return c.JSON(401, map[string]string{
				"error":  "signature mismatch",
				"detail": fmt.Sprintf("body hash: %s, signature hash: %s", bodyHash, sig.DataHash),
			})
		}

		// check signature not too old
		age := time.Since(time.Unix(sig.Data.Timestamp/1000, 0))
		if age > (time.Hour * 48) {
			return c.JSON(401, map[string]string{
				"error":  "signature too old",
				"detail": age.String(),
			})
		}

		// check signature is from delegate owner wallet
		if !strings.EqualFold(sig.SignerWallet, ss.Config.Self.Wallet) {
			return c.JSON(401, map[string]string{
				"error":  "signature not from owner",
				"detail": fmt.Sprintf("signer: %s, owner: %s", sig.SignerWallet, ss.Config.Self.Wallet),
			})
		}

		return next(c)
	}
}
