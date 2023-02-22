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

		isValidSignature, err := VerifySignature(*signatureData, signature, requestedCid)
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

	unmarshalledSignature := make(map[string]string)
	err = json.Unmarshal([]byte(decodedSignature), &unmarshalledSignature)
	if err != nil {
		return nil, nil, err
	}

	signature := unmarshalledSignature["signature"]

	rawData := unmarshalledSignature["data"]
	rawSignatureData := make(map[string]interface{})
	err = json.Unmarshal([]byte(rawData), &rawSignatureData)
	if err != nil {
		return nil, nil, err
	}

	unsignedCid, ok := rawSignatureData["cid"].(string)
	if !ok {
		return nil, nil, fmt.Errorf("`cid` couldn't be parsed from the signature data, got=%s", unsignedCid)
	}

	unsignedTimestamp, ok := rawSignatureData["timestamp"].(float64)
	if !ok {
		return nil, nil, fmt.Errorf("`timestamp` couldn't be parsed from the signature data, got=%+v", unsignedTimestamp)
	}

	unsignedTrackId, ok := rawSignatureData["trackId"].(float64)
	if !ok {
		return nil, nil, fmt.Errorf("`trackId` couldn't be parsed from the signature data, got=%+v", unsignedTrackId)
	}

	unsignedShouldCache, ok := rawSignatureData["shouldCache"].(bool)
	if !ok {
		return nil, nil, fmt.Errorf("`shouldCache` couldn't be parsed from the signature data, got=%+v", unsignedShouldCache)
	}

	signatureData := &SignatureData{
		Cid:         unsignedCid,
		Timestamp:   int64(unsignedTimestamp),
		TrackId:     int64(unsignedTrackId),
		ShouldCache: unsignedShouldCache,
	}

	return signatureData, []byte(signature), nil
}
