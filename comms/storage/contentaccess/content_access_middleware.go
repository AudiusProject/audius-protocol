package contentaccess

import (
	"encoding/json"
	"errors"
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

func parseQueryParams(values url.Values) (*SignatureData, string, error) {
	encodedSignature := values.Get("signature")
	decodedSignature, err := url.QueryUnescape(encodedSignature)
	if err != nil {
		return nil, "", err
	}

	unmarshalledSignature := make(map[string]string)
	err = json.Unmarshal([]byte(decodedSignature), &unmarshalledSignature)
	if err != nil {
		return nil, "", err
	}

	signature := unmarshalledSignature["signature"]

	rawData := unmarshalledSignature["data"]
	rawSignatureData := make(map[string]interface{})
	err = json.Unmarshal([]byte(rawData), &rawSignatureData)
	if err != nil {
		return nil, "", err
	}

	unsignedCid, ok := rawSignatureData["cid"].(string)
	if !ok {
		return nil, "", errors.New("`cid` couldn't be parsed from the signature data")
	}

	unsignedTimestamp, ok := rawSignatureData["timestamp"].(int64)
	if !ok {
		return nil, "", errors.New("`timestamp` couldn't be parsed from the signature data")
	}

	unsignedTrackId, ok := rawSignatureData["trackId"].(int64)
	if !ok {
		return nil, "", errors.New("`trackId` couldn't be parsed from the signature data")
	}

	unsignedShouldCache, ok := rawSignatureData["shouldCache"].(bool)
	if !ok {
		return nil, "", errors.New("`shouldCache` couldn't be parsed from the signature data")
	}

	signatureData := &SignatureData{
		Cid:         unsignedCid,
		Timestamp:   unsignedTimestamp,
		TrackId:     unsignedTrackId,
		ShouldCache: unsignedShouldCache,
	}

	return signatureData, signature, nil
}
