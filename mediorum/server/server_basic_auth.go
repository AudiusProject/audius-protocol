package server

import (
	"encoding/hex"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
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
