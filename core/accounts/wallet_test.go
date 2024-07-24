package accounts

import (
	"fmt"
	"os"
	"testing"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
)

func TestHexWalletToPrivKey(t *testing.T) {
	expectedAddress := "0x034aE5e3a83C7B3c1E7717c1EAB1e31959b677eB"
	privKeyHexStr := "7336903a49bbb43ffa76c33fc574c6a1ec3fa612b0d7c397d8e002a9a66f74ec"

	cometKey, err := EthToCometKey(privKeyHexStr)
	require.Nil(t, err)
	require.EqualValues(t, 32, len(cometKey))

	ethKey, err := CometToEthKey(cometKey)
	require.Nil(t, err)

	ethAddress := crypto.PubkeyToAddress(ethKey.PublicKey).Hex()
	require.EqualValues(t, expectedAddress, ethAddress)
}

func TestKeyWritingAndReading(t *testing.T) {
	expectedAddress := "0x034aE5e3a83C7B3c1E7717c1EAB1e31959b677eB"
	privKeyHexStr := "7336903a49bbb43ffa76c33fc574c6a1ec3fa612b0d7c397d8e002a9a66f74ec"

	key, err := NewKey(privKeyHexStr)
	require.Nil(t, err)

	require.EqualValues(t, expectedAddress, key.EthAddress())

	// write to tmp file
	tmpFilePath := fmt.Sprintf("./%s.json", uuid.New().String())
	err = key.SaveAs(tmpFilePath)
	require.Nil(t, err)

	// read back that file and assert it matches the initial key
	readKey, err := LoadKey(tmpFilePath)
	require.Nil(t, err)
	require.EqualValues(t, expectedAddress, readKey.EthAddress())

	err = os.Remove(tmpFilePath)
	require.Nil(t, err, "could not cleanup test key file")
}
