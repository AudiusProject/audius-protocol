package serviceproxy

import (
	"crypto/ecdsa"
	"crypto/rand"
	"fmt"
	"log"
	"net"
	"net/http"
	"testing"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/require"
)

func TestProxyService(t *testing.T) {
	// create servicee pkey, someone using the proxy from the servicer
	serviceePkey, err := ecdsa.GenerateKey(crypto.S256(), rand.Reader)
	if err != nil {
		t.Fatalf("failed to generate private key: %v", err)
	}

	// create unregistered user, someone trying to use the proxy
	unregisteredPkey, err := ecdsa.GenerateKey(crypto.S256(), rand.Reader)
	if err != nil {
		t.Fatalf("failed to generate private key: %v", err)
	}

	logger := common.NewLogger(nil)

	// start echo server on open port
	e := echo.New()
	e.HideBanner = true
	defer e.Close()

	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		t.Fatalf("failed to find port: %v", err)
	}

	go func() {
		if err := e.Server.Serve(listener); err != nil && err != http.ErrServerClosed {
			log.Fatalf("shutting down the server: %v", err)
		}
	}()

	addr := listener.Addr().String()
	ipRoute := fmt.Sprintf("http://%s/ip", addr)

	// create direct proxy with stub data, empty api key
	servicerDirectProxy := NewDirectProxy(logger, "", true)
	serviceeRemoteProxy := NewRemoteProxy(logger, serviceePkey, []string{ipRoute}, 10)
	unregisteredRemoteProxy := NewRemoteProxy(logger, unregisteredPkey, []string{ipRoute}, 10)

	registeredNodes := map[string]struct{}{
		crypto.PubkeyToAddress(serviceePkey.PublicKey).Hex(): {},
	}

	// create service and register route with echo
	proxyRoutes := NewProxyRoutes(registeredNodes, servicerDirectProxy)
	e.GET("/ip/:ip", proxyRoutes.GetIPDataRoute)

	t.Run("Registered node can call proxy", func(t *testing.T) {
		res, err := serviceeRemoteProxy.GetIPData("127.0.0.1")
		if err != nil {
			t.Fatalf("servicee received error from proxy: %v", err)
		}
		require.NotNil(t, res)
	})

	t.Run("Unregistered node is denied access", func(t *testing.T) {
		res, err := unregisteredRemoteProxy.GetIPData("127.0.0.1")
		if err == nil {
			t.Fatalf("unregistered node was able to call proxy")
		}
		require.Nil(t, res)
	})
}
