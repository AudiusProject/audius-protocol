package serviceproxy

import (
	"crypto/ecdsa"
	"time"

	"github.com/labstack/echo/v4"
)

type SignedData struct {
	ip        string
	timestamp int64
}

func signProxyRequest(pkey *ecdsa.PrivateKey) error {
	now := time.Now().Unix()
	return nil
}

func validateProxyRequest(c echo.Context) error {
	return nil
}
