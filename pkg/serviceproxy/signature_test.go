package serviceproxy

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
)

const (
	TestServerHost       = "127.0.0.1"
	TestInvalidJSON      = "{invalid json}"
	TestInvalidSignature = "invalidsignature"
	TestValidEndpoint    = "/"
)

func TestValidateProxyRequest(t *testing.T) {
	// Generate a new private key for signing
	privKey, err := ecdsa.GenerateKey(crypto.S256(), rand.Reader)
	if err != nil {
		t.Fatalf("failed to generate private key: %v", err)
	}

	// Helper function to create a signed request
	createSignedRequest := func(ip string, reqTime int64) (*http.Request, error) {
		req := httptest.NewRequest(http.MethodGet, TestValidEndpoint, nil)
		err := signProxyRequest(privKey, req, ip, reqTime)
		return req, err
	}

	// Initialize Echo context and registered nodes map
	e := echo.New()
	registeredNodes := map[string]struct{}{
		crypto.PubkeyToAddress(privKey.PublicKey).Hex(): {},
	}

	t.Run("MissingHeaders", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, TestValidEndpoint, nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := validateProxyRequest(c, registeredNodes)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "Missing signature or data headers")
	})

	t.Run("InvalidJSONData", func(t *testing.T) {
		req, _ := createSignedRequest(TestServerHost, time.Now().Unix())
		req.Header.Set(JsonDataHeader, TestInvalidJSON) // Intentionally invalid JSON
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := validateProxyRequest(c, registeredNodes)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "Invalid JSON data format")
	})

	t.Run("InvalidSignatureFormat", func(t *testing.T) {
		req, _ := createSignedRequest(TestServerHost, time.Now().Unix())
		req.Header.Set(JsonSignatureDataHeader, TestInvalidSignature) // Intentionally invalid hex
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := validateProxyRequest(c, registeredNodes)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "Invalid signature format")
	})

	t.Run("SignatureVerificationFailed", func(t *testing.T) {
		// Create a signed request with a legitimate timestamp
		reqTime := time.Now().Unix()
		req, _ := createSignedRequest(TestServerHost, reqTime)

		// Alter IP to invalidate
		badSignatureData := `{"ip":"127.0.0.2","timestamp":` + fmt.Sprintf("%d", reqTime) + `}`

		req.Header.Set(JsonDataHeader, badSignatureData)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := validateProxyRequest(c, registeredNodes)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "Unregistered node")
	})

	t.Run("RequestExpired", func(t *testing.T) {
		req, _ := createSignedRequest(TestServerHost, time.Now().Unix()-IPSignatureExpirationSecs-1)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := validateProxyRequest(c, registeredNodes)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "Request has expired")
	})

	t.Run("UnregisteredNode", func(t *testing.T) {
		// Generate a different key pair to simulate an unregistered node
		otherKey, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
		req := httptest.NewRequest(http.MethodGet, TestValidEndpoint, nil)
		signProxyRequest(otherKey, req, TestServerHost, time.Now().Unix())
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := validateProxyRequest(c, registeredNodes)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "Unregistered node")
	})
}
