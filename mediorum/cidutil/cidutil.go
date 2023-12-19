package cidutil

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/url"
	"path/filepath"
	"strings"

	"github.com/ipfs/go-cid"
	"github.com/labstack/echo/v4"
	"github.com/mr-tron/base58/base58"
	"github.com/multiformats/go-multihash"
)

func UnescapeCidParam(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		cid := c.Param("cid")
		unescapedCid, err := url.PathUnescape(cid)
		if err != nil {
			return err
		}
		c.SetParamNames("cid")
		c.SetParamValues(unescapedCid)

		return next(c)
	}
}

func ComputeFileHeaderCID(fh *multipart.FileHeader) (string, error) {
	f, err := fh.Open()
	if err != nil {
		return "", err
	}
	defer f.Close()
	return ComputeFileCID(f)
}

func ComputeFileCID(f io.ReadSeeker) (string, error) {
	defer f.Seek(0, 0)
	builder := cid.V1Builder{}
	hash, err := multihash.SumStream(f, multihash.SHA2_256, -1)
	if err != nil {
		return "", err
	}
	cid, err := builder.Sum(hash)
	if err != nil {
		return "", err
	}
	return cid.String(), nil
}

// note: any Qm CID will be invalid because its hash won't match the contents
func ValidateCID(expectedCID string, f io.ReadSeeker) error {
	if isPlaced, _, cid := ParsePlacedCID(expectedCID); isPlaced {
		expectedCID = cid
	}
	computed, err := ComputeFileCID(f)
	if err != nil {
		return err
	}
	if computed != expectedCID {
		return fmt.Errorf("expected cid: %s but contents hashed to %s", expectedCID, computed)
	}
	return nil
}

// Returns true both for "Qm" CIDs AND for for keys like "Qmwhatever/150x150.jpg" to support legacy migrated keys
func IsLegacyCID(cid string) bool {
	return strings.HasPrefix(cid, "Qm")
}

// Only returns true for exact v0 CIDs (46 chars and start with "Qm")
func IsLegacyCIDStrict(cid string) bool {
	return IsLegacyCID(cid) && len(cid) == 46
}

func ParsePlacedCID(placedCid string) (isPlaced bool, placement string, vanillaCid string) {
	idx := strings.Index(placedCid, "!")
	if idx == -1 {
		return false, "", placedCid
	}
	return true, placedCid[:idx], placedCid[idx+1:]
}

func EncodePlacedCID(hosts []string, cid string) string {
	// if for some reason it's already placed, rewrite placement
	if isPlaced, _, cid := ParsePlacedCID(cid); isPlaced {
		return EncodePlacedCID(hosts, cid)
	}

	placement := EncodePlacementHosts(hosts)
	return fmt.Sprintf("%s!%s", placement, cid)
}

func EncodePlacementHosts(hosts []string) string {
	j := strings.Join(hosts, ",")
	return base58.Encode([]byte(j))
}

func DecodePlacementHosts(p string) ([]string, error) {
	b, err := base58.Decode(p)
	if err != nil {
		return nil, err
	}
	return strings.Split(string(b), ","), nil
}

// Returns a sharded filepath/key for CID based on CID version.
// V0: last 3 chars, offset by 1
// V1: last 5 chars
// Fallback: unchanged (for legacy migrated keys like "Qm.../150x150.jpg")
func ShardCID(cidStr string) string {
	if IsLegacyCIDStrict(cidStr) {
		return shardLegacyCID(cidStr)
	}
	isPlaced, _, _ := ParsePlacedCID(cidStr)
	if strings.HasPrefix(cidStr, "ba") || isPlaced {
		return shardCIDV1(cidStr)
	}
	return cidStr
}

// Returns sharded filepath for CID V0. Ex: returns "QuP/QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPU" for "QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPU"
func shardLegacyCID(cid string) string {
	shard := cid[len(cid)-4 : len(cid)-1]
	return filepath.Join(shard, cid)
}

// Returns sharded filepath for CID V1. Ex: returns "ru7u2/baeaaaiqsecffzabbj7utfkkmywbhlls46twtaq3fbvpbozvugl4bqszfru7u2" for "baeaaaiqsecffzabbj7utfkkmywbhlls46twtaq3fbvpbozvugl4bqszfru7u2"
func shardCIDV1(cid string) string {
	// it would technically be more correct to parse CID and then do `cid.Hash().HexString()[0:5]`, but this way is easier to calculate filepath manually given a CID
	shard := cid[len(cid)-5:]
	return filepath.Join(shard, cid)
}

// /img/shard/orig_cid/150x150.jpg
func ImageVariantPath(id, variant string) string {
	return filepath.Join("img", shardCIDV1(id), variant)
}
