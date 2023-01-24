package peering

import (
	"encoding/json"
	"net/http"

	"github.com/labstack/echo/v4"
)

// ExchangeEndpoint is used by registered nodes to exchange some extra information
// that's not "on chain"
// after validating request came from a registered peer
// this server should respond with connection info
func ExchangeEndpoint(c echo.Context) error {
	registeredNodes, err := AllNodes()
	if err != nil {
		return err
	}

	payload, senderAddress, err := ReadSignedRequest(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	var theirInfo Info
	err = json.Unmarshal(payload, &theirInfo)
	if err != nil {
		return c.String(http.StatusBadRequest, "bad json")
	}

	// check senderAddress is in known list
	if !WalletEquals(theirInfo.Address, senderAddress) {
		return c.String(400, "recovered wallet doesn't match payload wallet")
	}
	knownWallet := false
	for _, sp := range registeredNodes {
		if WalletEquals(senderAddress, sp.DelegateOwnerWallet) {
			knownWallet = true
		}
	}
	if !knownWallet {
		return c.String(400, "recovered wallet not a registered service provider")
	}

	myInfo, err := MyInfo()
	if err != nil {
		return err
	}
	return c.JSON(200, myInfo)
}
