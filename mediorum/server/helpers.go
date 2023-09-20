package server

import (
	"errors"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/erni27/imcache"
	"github.com/labstack/echo/v4"
	"github.com/oklog/ulid/v2"
)

func apiPath(parts ...string) string {
	host := parts[0]
	parts[0] = apiBasePath
	u, err := url.Parse(host)
	if err != nil {
		panic(err)
	}
	u = u.JoinPath(parts...)
	return u.String()
}

// replaces the host portion of a URL, maintaining path and query params, and setting the scheme to https for prod/stage
func (ss *MediorumServer) replaceHost(c echo.Context, newHost string) url.URL {
	u := *c.Request().URL
	u.Host = cleanHost(newHost)
	u.Scheme = ss.getScheme()
	return u
}

func (ss *MediorumServer) getScheme() string {
	if ss.Config.Env == "stage" || ss.Config.Env == "prod" {
		return "https"
	} else {
		return "http"
	}
}

// gets the host from a URL string
// without protocol/scheme
func cleanHost(host string) string {
	u, _ := url.Parse(host)
	return u.Host
}

type ByteRange struct {
	Start, End int
}

func parseByteRange(headerValue string) []ByteRange {
	// can be multiple ranges i.e. `bytes=100-200,300-400`
	ranges := make([]ByteRange, 0)
	headerValue = strings.TrimPrefix(headerValue, "bytes=")
	rangeValues := strings.Split(headerValue, ",")

	for _, rangeValue := range rangeValues {
		rangeValue = strings.TrimSpace(rangeValue)
		rangeParts := strings.Split(rangeValue, "-")
		start, err := strconv.Atoi(rangeParts[0])
		if err != nil {
			continue // skip invalid range
		}

		var end int
		if len(rangeParts) > 1 && rangeParts[1] != "" {
			end, err = strconv.Atoi(rangeParts[1])
			if err != nil {
				continue // skip invalid range
			}
		} else {
			end = -1 // indicate an open-ended range
		}

		ranges = append(ranges, ByteRange{Start: start, End: end})
	}

	return ranges
}

func rangeIsFirstByte(headerValue string) bool {
	if headerValue == "" {
		// no `Range:` header set, which infers a full content response
		return true
	}
	for _, byteRange := range parseByteRange(headerValue) {
		if byteRange.Start == 0 {
			return true
		}
	}
	return false
}

func (ss *MediorumServer) getUploadOrigCID(uploadId string) (string, error) {
	if _, err := ulid.Parse(uploadId); err != nil {
		return "", err
	}

	if cid, ok := ss.uploadOrigCidCache.Get(uploadId); ok {
		return cid, nil
	}

	var upload Upload
	if err := ss.crud.DB.First(&upload, "id = ?", uploadId).Error; err == nil {
		ss.uploadOrigCidCache.Set(uploadId, upload.OrigFileCID, imcache.WithDefaultExpiration())
		return upload.OrigFileCID, nil
	}

	// since still no gossip... we might not have upload record...
	// try to get upload from healthy peers
	for _, peerHost := range ss.findHealthyPeers(time.Hour) {
		if upload, err := ss.peerGetUpload(peerHost, uploadId); err == nil {
			ss.uploadOrigCidCache.Set(uploadId, upload.OrigFileCID, imcache.WithDefaultExpiration())
			return upload.OrigFileCID, nil
		}
	}

	return "", errors.New("unknown upload: " + uploadId)
}

func parseVariantSize(variant string) (w, h int, err error) {
	// 150x150, 480x480, 1000x1000
	// 640x, 2000x
	variant = strings.ToLower(variant)
	variant = strings.Replace(variant, ".jpg", "", 1)
	switch variant {
	case "150x150":
		return 150, 150, nil
	case "480x480":
		return 480, 480, nil
	case "1000x1000":
		return 1000, 1000, nil
	case "640x":
		return 640, -1, nil
	case "2000x":
		return 2000, -1, nil

	}
	return 0, 0, errors.New("invalid size")
}
