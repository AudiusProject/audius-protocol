package contentaccess

import (
	"encoding/json"
	"net/url"

	"comms.audius.co/shared/peering"
	"github.com/labstack/echo/v4"
)

type CustomRequest struct {
	echo.Context
	ShouldCache bool
}

func ContentAccessMiddleware(p peering.IPeering) func(next echo.HandlerFunc) echo.HandlerFunc {
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

			nodes, err := p.GetDiscoveryNodes()
			if err != nil {
				return echo.ErrInternalServerError
			}

			err = VerifySignature(nodes, *signatureData, []byte(signature), requestedCid)
			if err != nil {
				return echo.ErrBadRequest
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
