package server

import (
	"fmt"
	"net/http"

	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
)

func TestRequireRegisteredSignatureWithUnregisteredNode(t *testing.T) {
	ss := testNetwork[0]

	// Empty list of signers means no node's signature will be valid
	origPeers := ss.Config.Peers
	defer func() {
		ss.Config.Peers = origPeers
	}()
	ss.Config.Signers = []Peer{}

	cid := "QmP4b7jYPeb4tbdCpd1qkP4zkDteb5zMZa8Yk46whtNYv2"
	signature := "%7B%22data%22%3A%20%22%7B%5C%22trackId%5C%22%3A%20220350%2C%20%5C%22cid%5C%22%3A%20%5C%22QmP4b7jYPeb4tbdCpd1qkP4zkDteb5zMZa8Yk46whtNYv2%5C%22%2C%20%5C%22timestamp%5C%22%3A%201596159123000%2C%20%5C%22shouldCache%5C%22%3A%201%7D%22%2C%20%22signature%22%3A%20%220x0f0627a064bd2c3f8add3214e10c85c727ba9a73fe8b1d689c6322f872dff5c263f2adbb156fadcb600b19787c704a0d608e5a4d0bb50748bbe3c2ba6ad262291c%22%7D"
	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/tracks/cidstream/%s?signature=%s", cid, signature), nil)

	rec := httptest.NewRecorder()
	c := ss.echo.NewContext(req, rec)
	c.SetPath("/tracks/cidstream/:cid")
	c.SetParamNames("cid")
	c.SetParamValues(cid)

	// Handle the request
	h := ss.requireRegisteredSignature(func(c echo.Context) error {
		return c.String(http.StatusOK, "test")
	})
	h(c)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
	body := rec.Body.String()
	assert.Contains(t, body, "signer not in list of registered nodes")
}

func TestRequireRegisteredSignatureWithOldTimestamp(t *testing.T) {
	ss := testNetwork[0]

	// Make sure the wallet is registered as a signer
	origPeers := ss.Config.Peers
	defer func() {
		ss.Config.Peers = origPeers
	}()
	ss.Config.Signers = []Peer{{Host: "discovery.node", Wallet: "0xF2974c76a6EFaf0338c69e467d843D54e6a91fdE"}}

	cid := "QmP4b7jYPeb4tbdCpd1qkP4zkDteb5zMZa8Yk46whtNYv2"
	signature := "%7B%22data%22%3A%20%22%7B%5C%22trackId%5C%22%3A%20220350%2C%20%5C%22cid%5C%22%3A%20%5C%22QmP4b7jYPeb4tbdCpd1qkP4zkDteb5zMZa8Yk46whtNYv2%5C%22%2C%20%5C%22timestamp%5C%22%3A%201596159123000%2C%20%5C%22shouldCache%5C%22%3A%201%7D%22%2C%20%22signature%22%3A%20%220x0f0627a064bd2c3f8add3214e10c85c727ba9a73fe8b1d689c6322f872dff5c263f2adbb156fadcb600b19787c704a0d608e5a4d0bb50748bbe3c2ba6ad262291c%22%7D"
	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/tracks/cidstream/%s?signature=%s", cid, signature), nil)

	rec := httptest.NewRecorder()
	c := ss.echo.NewContext(req, rec)
	c.SetPath("/tracks/cidstream/:cid")
	c.SetParamNames("cid")
	c.SetParamValues(cid)

	// Handle the request
	h := ss.requireRegisteredSignature(func(c echo.Context) error {
		return c.String(http.StatusOK, "test")
	})
	h(c)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
	body := rec.Body.String()
	assert.Contains(t, body, "signature too old")
}
