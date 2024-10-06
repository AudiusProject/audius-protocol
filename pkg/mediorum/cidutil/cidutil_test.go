package cidutil

import (
	"bytes"
	"testing"

	"github.com/stretchr/testify/assert"
)

var (
	v0CID         = "QmP8Wuu1kN9iHBoBptB4UrTN3orna3Z6ZW2xevNkoE2y22"
	v0CIDMigrated = "QmP8Wuu1kN9iHBoBptB4UrTN3orna3Z6ZW2xevNkoE2y22/150x150.jpg"
	v1CID         = "baeaaaiqsecffzabbj7utfkkmywbhlls46twtaq3fbvpbozvugl4bqszfru7u2"
	uuid          = "FKFFJMUVC2JJKRZLS64KM5M7AI3HJCWJ"
)

func TestIsLegacyCID(t *testing.T) {
	if !IsLegacyCID(v0CID) {
		t.Errorf("IsLegacyCID failed for v0 CID")
	}

	if !IsLegacyCIDStrict(v0CID) {
		t.Errorf("IsLegacyCIDStrict failed for v0 CID")
	}

	if !IsLegacyCID(v0CIDMigrated) {
		t.Errorf("IsLegacyCID failed for migrated v0 CID")
	}

	if IsLegacyCIDStrict(v0CIDMigrated) {
		t.Errorf("IsLegacyCIDStrict failed for migrated v0 CID")
	}

	if IsLegacyCID(v1CID) {
		t.Errorf("IsLegacyCID failed for v1 CID")
	}

	if IsLegacyCID(uuid) {
		t.Errorf("IsLegacyCID failed for UUID")
	}
}

func TestShardCID(t *testing.T) {
	assert.Equal(t, "2y2/QmP8Wuu1kN9iHBoBptB4UrTN3orna3Z6ZW2xevNkoE2y22", ShardCID(v0CID))
	assert.Equal(t, "ru7u2/baeaaaiqsecffzabbj7utfkkmywbhlls46twtaq3fbvpbozvugl4bqszfru7u2", ShardCID(v1CID))

	assert.Equal(t, "img/XK5X5/01HA2C60D80CYWZP3FWZZXK5X5/150x150", ImageVariantPath("01HA2C60D80CYWZP3FWZZXK5X5", "150x150"))

}

func TestEmptyCID(t *testing.T) {
	cid, err := ComputeFileCID(bytes.NewReader([]byte{}))
	assert.NoError(t, err)
	assert.Equal(t, "baeaaaiqsedr3brcctd6byfe27p2mrglpxescplsb4rsjxe2muskzsg3ykk4fk", cid)
}
