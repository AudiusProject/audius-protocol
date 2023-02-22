package contentaccess

import (
	"encoding/json"
	"fmt"
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

func parseSignature(rawSignature string) ([]byte, string, error) {
	unmarshalledSignature := make(map[string][]byte)
	err := json.Unmarshal([]byte(rawSignature), &unmarshalledSignature)
	if err != nil {
		return nil, "", err
	}

	signature, ok := unmarshalledSignature["signature"]
	if !ok {
		return nil, "", fmt.Errorf("could not decode signature")
	}

	rawData, ok := unmarshalledSignature["data"]
	if !ok {
		return nil, "", fmt.Errorf("could not decode raw data")
	}

	return signature, string(rawData), nil
}

func parseSignatureData(rawData string) (*SignatureData, error) {
	rawSignatureData := make(map[string]interface{})
	err := json.Unmarshal([]byte(rawData), &rawSignatureData)
	if err != nil {
		return nil, err
	}

	unsignedCid, ok := rawSignatureData["cid"].(string)
	if !ok {
		return nil, fmt.Errorf("`cid` couldn't be parsed from the signature data, got=%s", unsignedCid)
	}

	unsignedTimestamp, ok := rawSignatureData["timestamp"].(float64)
	if !ok {
		return nil, fmt.Errorf("`timestamp` couldn't be parsed from the signature data, got=%+v", unsignedTimestamp)
	}

	unsignedTrackId, ok := rawSignatureData["trackId"].(float64)
	if !ok {
		return nil, fmt.Errorf("`trackId` couldn't be parsed from the signature data, got=%+v", unsignedTrackId)
	}

	unsignedShouldCache, ok := rawSignatureData["shouldCache"].(bool)
	if !ok {
		return nil, fmt.Errorf("`shouldCache` couldn't be parsed from the signature data, got=%+v", unsignedShouldCache)
	}

	signatureData := &SignatureData{
		Cid:         unsignedCid,
		Timestamp:   int64(unsignedTimestamp),
		TrackId:     int64(unsignedTrackId),
		ShouldCache: unsignedShouldCache,
	}

	return signatureData, nil
}