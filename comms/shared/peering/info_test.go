package peering

import (
	"os"
	"testing"

	"comms.audius.co/discovery/config"
	"github.com/stretchr/testify/assert"
)

func TestInfo(t *testing.T) {
	os.Setenv("AUDIUS_TEST_HOST", "1.2.3.4")
	os.Setenv("AUDIUS_DELEGATE_PRIVATE_KEY", "293589cdf207ed2f2253bb72b17bb7f2cfe399cdc34712b1d32908d969682238")

	discoveryConfig := config.GetDiscoveryConfig()
	p := New(&discoveryConfig.PeeringConfig)
	info, err := p.MyInfo()
	assert.NoError(t, err)
	assert.Equal(t, "0x1c185053c2259f72fd023ED89B9b3EBbD841DA0F", info.Address)
	assert.Equal(t, "UDQ7FQ4GSZKLLCDTHWPFBDSWJQKNT5S7CA7NGUS7RQZZOANZFIRIJII2", info.Nkey)
	assert.Equal(t, "1.2.3.4", info.IP)
}
