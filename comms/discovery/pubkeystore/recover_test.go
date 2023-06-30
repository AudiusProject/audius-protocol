package pubkeystore

import (
	"context"
	"fmt"
	"math/big"
	"os"
	"testing"

	"comms.audius.co/discovery/config"
	"github.com/stretchr/testify/assert"
)

func TestRecovery(t *testing.T) {
	t.Skip()

	var err error

	// dagron
	os.Setenv("AUDIUS_IS_STAGING", "true")
	discoveryConfig := config.Parse()
	err = Dial(discoveryConfig)
	assert.NoError(t, err)

	// addUser on POA
	{

		blocknumber := big.NewInt(14412789)

		pk, err := findAddUserTransaction(context.Background(), blocknumber, "0xB5f6A1B59FeAc1453Cb9E768b8f0cF7fc172DcA3")
		assert.NoError(t, err)
		fmt.Println(pk)
	}

	// EM on POA
	{
		txhash := "0x784b1cbd5dbead07ea78fc0dba65cccd0582be6ec41413a8c73546a3dcaa0c28"
		wallet := "0xd3a17ed773a5479097df5b41b15f798affa6040f"

		pk, err := recoverEntityManagerPubkey(poaClient, txhash, wallet)
		assert.NoError(t, err)
		fmt.Println(pk)
	}

	// EM on audius chain
	{
		txhash := "0xbf7f9501da15bbafac583276f0e303ed1827dbe79d04a6d62d4dcd586515756a"
		wallet := "0xbb70390859ce84afc5d47c2eea6c89462faa6c7e"

		pk, err := recoverEntityManagerPubkey(acdcClient, txhash, wallet)
		assert.NoError(t, err)
		fmt.Println(pk)
	}

}

func TestRecoveryProd(t *testing.T) {
	t.Skip()

	var err error

	// dagron
	discoveryConfig := config.Parse()
	err = Dial(discoveryConfig)
	assert.NoError(t, err)

	// addUser on POA
	{
		// 8592904
		blocknumber := big.NewInt(29382239)

		pk, err := findAddUserTransaction(context.Background(), blocknumber, "0x87c233438e9cf31a12bb085083056dc2169c9d56")
		assert.NoError(t, err)
		fmt.Println(pk)
	}
}
