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

		pk, err := findAddUserTransaction(context.Background(), blocknumber, "")
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
		txhash := "0xec9daecc8269b9629baff0e53abaaa8e1bced65fb3fa48aa1950bfe8ada4f075"
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
		blocknumber := big.NewInt(8592904)

		pk, err := findAddUserTransaction(context.Background(), blocknumber, "")
		assert.NoError(t, err)
		fmt.Println(pk)
	}
}
