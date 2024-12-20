package contracts

import (
	"context"
	"testing"

	"github.com/davecgh/go-spew/spew"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/stretchr/testify/require"
)

func TestGetAllRegisteredNodes(t *testing.T) {
	// not meant to run all the time, skip in ci
	// t.SkipNow()

	ctx := context.Background()

	ethrpc, err := ethclient.Dial("https://eth.audius.co")
	require.Nil(t, err)
	defer ethrpc.Close()

	c, err := NewAudiusContracts(ethrpc, "0xd976d3b4f4e22a238c1A736b6612D22f17b6f64C")
	require.Nil(t, err)

	nodes, err := c.GetAllRegisteredNodes(ctx)
	require.Nil(t, err)

	spew.Dump(nodes)
}
