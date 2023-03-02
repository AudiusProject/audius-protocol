package contentaccess

import (
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/url"
	"strings"

	"comms.audius.co/shared/peering"
	"github.com/labstack/echo/v4"
)

type CustomRequest struct {
	echo.Context
	ShouldCache bool
}

func ContentAccessMiddleware(p peering.Peering) func(next echo.HandlerFunc) echo.HandlerFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {

			requestedCid := c.Param("CID")
			if requestedCid == "" {
				return echo.NewHTTPError(http.StatusBadRequest, "missing CID parameter")
			}

			signatureData, signature, err := parseQueryParams(c.QueryParams())
			if err != nil {
				return echo.NewHTTPError(http.StatusBadRequest, err.Error())
			}

			nodes, err := p.GetDiscoveryNodes()
			if err != nil {
				return echo.ErrInternalServerError
			}

			err = VerifySignature(nodes, *signatureData, signature, requestedCid)
			if err != nil {
				return echo.NewHTTPError(http.StatusBadRequest, err.Error())
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

	// Remove the "0x" signatures since it'll break hex decoding
	signedAccessData.Signature = strings.TrimPrefix(signedAccessData.Signature, "0x")

	rawSignature, err := hex.DecodeString(signedAccessData.Signature)
	if err != nil {
		return nil, nil, err
	}

	return signatureData, rawSignature, nil
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
