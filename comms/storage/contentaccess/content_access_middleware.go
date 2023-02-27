package contentaccess

import (
	"encoding/json"
	"net/url"
	"strconv"

	"comms.audius.co/shared/peering"
	"github.com/labstack/echo/v4"
)

func ContentAccessMiddleware(peering *peering.Peering) func(next echo.HandlerFunc) echo.HandlerFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {

			requestedCid := c.Param("CID")
			if requestedCid == "" {
				return echo.ErrBadRequest
			}

			signatureData, signature, err := parseQueryParams(c.QueryParams())
			if err != nil {
				return echo.ErrBadRequest
			}

			isValidSignature, err := VerifySignature(peering, *signatureData, []byte(signature), requestedCid)
			if err != nil {
				return echo.ErrBadRequest
			}

			if !isValidSignature {
				return echo.ErrBadRequest
			}

			// If content is gated, set cache-control to no-cache.
    		// Otherwise, set the CID cache-control so that client caches the response for 30 days.
    		// The contentAccessMiddleware sets the req.contentAccess object so that we do not
    		// have to make another database round trip to get this info.
			if signatureData.ShouldCache {
				c.Response().Header().Add("cache-control", "public, max-age=2592000, immutable")
			} else {
				c.Response().Header().Add("cache-control", "no-cache")
			}

			return next(c)
		}
	}
}

func parseQueryParams(values url.Values) (*SignatureData, []byte, error) {
	encodedSignature := values.Get("signature")
	decodedSignature, err := url.QueryUnescape(encodedSignature)
	if err != nil {
		return nil, nil, err
	}

	signedAccessData, err := parseSignature(decodedSignature)
	if err != nil {
		return nil, nil, err
	}

	signatureData, err := parseSignatureData(signedAccessData.Data)
	if err != nil {
		return nil, nil, err
	}

	return signatureData, signedAccessData.Signature, nil
}

func parseSignature(rawSignature string) (*SignedAccessData, error) {
	var unmarshalledSignature SignedAccessData
	err := json.Unmarshal([]byte(rawSignature), &unmarshalledSignature)
	if err != nil {
		return nil, err
	}

	return &unmarshalledSignature, nil
}

func parseSignatureData(rawData json.RawMessage) (*SignatureData, error) {
	var signatureData SignatureData
	err := json.Unmarshal(rawData, &signatureData)
	if err != nil {
		return nil, err
	}

	return &signatureData, nil
}
