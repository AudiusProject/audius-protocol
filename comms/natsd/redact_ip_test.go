package natsd

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRedactIP(t *testing.T) {
	input := `{
		"ip": "127.0.0.1",
		"nested": {
			"ip_addr": "35.122.33.172"
		}
	}`

	output := string(redactIp([]byte(input)))

	assert.False(t, strings.Contains(output, "127.0.0.1"))
	assert.False(t, strings.Contains(output, "35.122.33.172"))
	assert.True(t, strings.Contains(output, "127.0.x.x"))
	assert.True(t, strings.Contains(output, "35.122.xx.xxx"))

	table := map[string]string{
		"35.122.33.172": "35.122.xx.xxx",
		"351122.33.172": "351122.33.172",
		"351.22.339172": "351.22.339172",
	}

	for input, expected := range table {
		output := string(redactIp([]byte(input)))
		assert.Equal(t, expected, output)
	}
}
