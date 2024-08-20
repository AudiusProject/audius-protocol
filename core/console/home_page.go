package console

import (
	"encoding/hex"
	"math"

	"github.com/AudiusProject/audius-protocol/core/console/components"
	"github.com/AudiusProject/audius-protocol/core/console/utils"
	"github.com/labstack/echo/v4"
)

func (cs *Console) homePage(c echo.Context) error {
	ctx := c.Request().Context()

	rpc := cs.rpc

	status, err := rpc.Status(ctx)
	if err != nil {
		return err
	}

	// syncing := status.SyncInfo.CatchingUp
	latestHeight := status.SyncInfo.LatestBlockHeight

	blockRange := 10
	minHeight := int64(math.Max(0, float64(latestHeight-int64(blockRange)+1)))
	maxHeight := latestHeight

	blockchainInfo, err := rpc.BlockchainInfo(ctx, minHeight, maxHeight)
	if err != nil {
		return err
	}

	txResults := []*components.TxProps{}

	for _, blockMeta := range blockchainInfo.BlockMetas {
		block, err := rpc.Block(ctx, &blockMeta.Header.Height)
		if err != nil {
			return err
		}

		for _, tx := range block.Block.Txs {
			txResults = append(txResults, &components.TxProps{
				Block:     block.Block.Height,
				Hash:      hex.EncodeToString(tx.Hash()),
				GasUsed:   0,
				Timestamp: block.Block.Time,
			})
		}
	}

	return utils.Render(c, components.HomePage(components.HomePageProps{
		Blocks: blockchainInfo.BlockMetas,
		Txs:    txResults,
	}))
}
