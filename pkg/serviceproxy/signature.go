package serviceproxy

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/davecgh/go-spew/spew"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/labstack/echo/v4"
)

const (
	JsonDataHeader            = "X-JSON-Data"
	JsonSignatureDataHeader   = "X-Signature-JSON-Data"
	IPSignatureExpirationSecs = 60
)

type SignedData struct {
	IP        string `json:"ip"`
	Timestamp int64  `json:"timestamp"`
}

func signProxyRequest(pkey *ecdsa.PrivateKey, req *http.Request, ip string, reqTime int64) error {

	// marshal jsonData to bytes
	jsonData, err := json.Marshal(&SignedData{
		IP:        ip,
		Timestamp: reqTime,
	})
	if err != nil {
		return err
	}

	dataHash := sha256.Sum256(jsonData)
	spew.Dump(dataHash)

	// sign hashed data
	signature, err := crypto.Sign(dataHash[:], pkey)
	if err != nil {
		return fmt.Errorf("failed to signed data: %v", err)
	}

	// encode to str for header transmission
	signatureStr := hex.EncodeToString(signature)
	jsonStr := string(jsonData)

	req.Header.Add(JsonDataHeader, jsonStr)
	req.Header.Add(JsonSignatureDataHeader, signatureStr)

	return nil
}

func validateProxyRequest(c echo.Context, registeredNodes map[string]struct{}) error {
	jsonDataStr := c.Request().Header.Get(JsonDataHeader)
	signatureStr := c.Request().Header.Get(JsonSignatureDataHeader)

	if jsonDataStr == "" || signatureStr == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Missing signature or data headers")
	}

	// Decode JSON data
	var signedData SignedData
	err := json.Unmarshal([]byte(jsonDataStr), &signedData)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid JSON data format")
	}

	// Decode the hex-encoded signature
	signature, err := hex.DecodeString(signatureStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid signature format")
	}

	// Hash the JSON data to verify the signature
	dataHash := sha256.Sum256([]byte(jsonDataStr))
	spew.Dump(dataHash)

	// Recover the public key from the signature
	recoveredPubKey, err := crypto.SigToPub(dataHash[:], signature)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Signature verification failed")
	}

	// check if signature has expired
	now := time.Now().Unix()
	reqTimestamp := signedData.Timestamp
	if now-reqTimestamp > IPSignatureExpirationSecs {
		return echo.NewHTTPError(http.StatusUnauthorized, "Request has expired")
	}

	// check if recovered address is registered
	recoveredAddress := crypto.PubkeyToAddress(*recoveredPubKey).Hex()
	_, ok := registeredNodes[recoveredAddress]
	if !ok {
		return echo.NewHTTPError(http.StatusUnauthorized, "Unregistered node")
	}

	return nil
}
