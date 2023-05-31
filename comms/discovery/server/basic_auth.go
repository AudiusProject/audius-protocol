package server

import (
	"encoding/hex"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/labstack/echo/v4"
)

// copy pasted from mediorum

func (ss *ChatServer) checkRegisteredNodeBasicAuth(user, pass string, c echo.Context) (bool, error) {
	// for dev:
	if ss.config.MyPrivateKey == nil {
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

	// add discovery 4 as an "honorary" peer
	if strings.EqualFold(wallet, "0x32bF5092890bb03A45bd03AaeFAd11d4afC9a851") {
		return true, nil
	}

	// check peer list for wallet
	for _, peer := range ss.config.Peers() {
		if strings.EqualFold(peer.Wallet, wallet) {
			return true, nil
		}
	}

	return false, echo.NewHTTPError(http.StatusBadRequest, "basic auth: wallet not in peer list "+wallet)

}
