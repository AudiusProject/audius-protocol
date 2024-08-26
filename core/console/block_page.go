package console

import (
	"encoding/hex"
	"fmt"
	"strconv"
	"strings"

	"github.com/AudiusProject/audius-protocol/core/console/components"
	"github.com/AudiusProject/audius-protocol/core/console/utils"
	coretypes "github.com/cometbft/cometbft/rpc/core/types"
	"github.com/labstack/echo/v4"
)

func (cs *Console) blockPage(c echo.Context) error {
	ctx := c.Request().Context()
	blockID := c.Param("block")

	rpc := cs.rpc

	var block *coretypes.ResultBlock

	// if block field is number then use it as height
	// otherwise assume it's block hash
	blockNum, err := strconv.ParseInt(blockID, 10, 64)
	if err != nil {
		blockHash, err := hex.DecodeString(strings.ToLower(blockID))
		if err != nil {
			return err
		}
		resultBlock, err := rpc.BlockByHash(ctx, blockHash)
		if err != nil {
			return err
		}
		block = resultBlock
	} else {
		resultBlock, err := rpc.Block(ctx, &blockNum)
		if err != nil {
			return err
		}
		block = resultBlock
	}

	txResults := []*components.TxProps{}
	for _, tx := range block.Block.Txs {
		txResults = append(txResults, &components.TxProps{
			Block:     block.Block.Height,
			Hash:      hex.EncodeToString(tx.Hash()),
			GasUsed:   0,
			Timestamp: block.Block.Time,
		})
	}

	return utils.Render(c, cs.c.BlockPage(components.BlockPageProps{
		Hash:      hex.EncodeToString(block.Block.Hash()),
		Height:    fmt.Sprint(block.Block.Height),
		Timestamp: block.Block.Time,
		Txs:       txResults,
	}))
}
