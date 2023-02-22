package contentaccess

import (
	"encoding/json"
	"net/url"

	"github.com/labstack/echo/v4"
)



func ContentAccessMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {

		requestedCid := c.Param("CID")
		if requestedCid == "" {
			return echo.ErrBadRequest
		}

		signatureData, signature, err := parseQueryParams(c.QueryParams())
		if err != nil {
			return echo.ErrBadRequest
		}

		isValidSignature, err := VerifySignature(*signatureData, []byte(signature), requestedCid)
		if err != nil {
			return echo.ErrBadGateway
		}

		if !isValidSignature {
			return echo.ErrBadRequest
		}

		return next(c)
	}
}

func parseQueryParams(values url.Values) (*SignatureData, []byte, error) {
	encodedSignature := values.Get("signature")
	decodedSignature, err := url.QueryUnescape(encodedSignature)
	if err != nil {
		return nil, nil, err
	}

	signature, rawData, err := parseSignature(decodedSignature)
	if err != nil {
		return nil, nil, err
	}

	signatureData, err := parseSignatureData(rawData)
	if err != nil {
		return nil, nil, err
	}

	return signatureData, signature, nil
}

func parseSignature(rawSignature string) ([]byte, json.RawMessage, error) {
	var unmarshalledSignature SignedAccessData
	err := json.Unmarshal([]byte(rawSignature), &unmarshalledSignature)
	if err != nil {
		return nil, nil, err
	}

	signature := unmarshalledSignature.Signature
	rawData := unmarshalledSignature.Data

	return signature, rawData, nil
}

func parseSignatureData(rawData json.RawMessage) (*SignatureData, error) {
	var signatureData SignatureData
	err := json.Unmarshal(rawData, &signatureData)
	if err != nil {
		return nil, err
	}

	return &signatureData, nil
}