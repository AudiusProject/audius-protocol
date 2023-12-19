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

func TestPlacedCID(t *testing.T) {
	cid, err := ComputeFileCID(bytes.NewReader([]byte("some placed content")))
	assert.NoError(t, err)
	hostList := []string{
		"http://example1.com",
		"http://example2.com",
		"http://example3.com",
	}
	pcid := EncodePlacedCID(hostList, cid)
	assert.Equal(t, "5CEvyaAfMXaGnHfYcEGnM2Bsk27kaxnRiPfdNW52eEmKjhuFw5X87vy5T8ikJNtCk1h9UdKt1ZVqNBbSU!baeaaaiqseb7vx734srjb6b64sueqv6ruamkyccuk5xpyisbiy726njey2hzwy", pcid)

	{

		isPlaced, placement, cid := ParsePlacedCID(pcid)
		assert.True(t, isPlaced)
		assert.Equal(t, "5CEvyaAfMXaGnHfYcEGnM2Bsk27kaxnRiPfdNW52eEmKjhuFw5X87vy5T8ikJNtCk1h9UdKt1ZVqNBbSU", placement)
		assert.Equal(t, "baeaaaiqseb7vx734srjb6b64sueqv6ruamkyccuk5xpyisbiy726njey2hzwy", cid)

		hosts, err := DecodePlacementHosts(placement)
		assert.NoError(t, err)
		assert.Equal(t, hostList, hosts)

		shard := ShardCID(pcid)
		assert.Equal(t, "2hzwy/5CEvyaAfMXaGnHfYcEGnM2Bsk27kaxnRiPfdNW52eEmKjhuFw5X87vy5T8ikJNtCk1h9UdKt1ZVqNBbSU!baeaaaiqseb7vx734srjb6b64sueqv6ruamkyccuk5xpyisbiy726njey2hzwy", shard)
	}
}
