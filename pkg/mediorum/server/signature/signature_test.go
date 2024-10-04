package signature

import (
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSignature(t *testing.T) {
	example := `%7B%22data%22%3A%20%22%7B%5C%22trackId%5C%22%3A%201485%2C%20%5C%22cid%5C%22%3A%20%5C%22QmdGpDEBq6v6Kv9H61HbeVqyiPo7iBe12tVtkhNig6ipWp%5C%22%2C%20%5C%22timestamp%5C%22%3A%201681484247930%2C%20%5C%22userId%5C%22%3A%2050419%2C%20%5C%22shouldCache%5C%22%3A%201%7D%22%2C%20%22signature%22%3A%20%220x54e5daff013068dfe10f9e360ca39b8cda8497652a6b029e71656ea538d541187c07e6241e8d06c9ea95df01152c3b8d87f2aeb28814fdce0c13978a884bf4fa1b%22%7D`
	value, err := url.QueryUnescape(example)
	assert.NoError(t, err)

	data, err := ParseFromQueryString(value)
	assert.NoError(t, err)
	// fmt.Printf("%+v \n", data)
	assert.Equal(t, data.SignerWallet, "0x5E98cBEEAA2aCEDEc0833AC3D1634E2A7aE0f3c2")
}
