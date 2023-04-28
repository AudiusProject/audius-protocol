package server

import (
	"crypto/ecdsa"
	"encoding/hex"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/labstack/echo/v4"
)

func parsePrivateKey(pk string) (*ecdsa.PrivateKey, error) {
	privateBytes, err := hex.DecodeString(pk)
	if err != nil {
		return nil, err
	}
	return crypto.ToECDSA(privateBytes)
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
	sig, err := hex.DecodeString(pass)
	if err != nil {
		return false, echo.NewHTTPError(http.StatusBadRequest, "basic auth: signature not hex", err)
	}

	hash := crypto.Keccak256Hash([]byte(user))
	pubkey, err := crypto.SigToPub(hash[:], sig)
	if err != nil {
		return false, echo.NewHTTPError(http.StatusBadRequest, "basic auth: invalid signature", err)
	}
	wallet := crypto.PubkeyToAddress(*pubkey).Hex()

	// check peer list for wallet
	for _, peer := range ss.Config.Peers {
		if strings.EqualFold(peer.Wallet, wallet) {
			return true, nil
		}
	}

	return false, echo.NewHTTPError(http.StatusBadRequest, "basic auth: wallet not in peer list "+wallet)

}
