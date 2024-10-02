package console

import (
	"encoding/hex"
	"fmt"
	"strconv"
	"strings"

	"github.com/AudiusProject/audius-protocol/pkg/core/console/views/pages"
	coretypes "github.com/cometbft/cometbft/rpc/core/types"
	"github.com/labstack/echo/v4"
)

func (con *Console) blockPage(c echo.Context) error {
	ctx := c.Request().Context()
	blockID := c.Param("block")

	rpc := con.rpc

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

	data := &pages.BlockView{
		Height:    fmt.Sprint(block.Block.Height),
		Hash:      hex.EncodeToString(block.Block.Hash()),
		Proposer:  block.Block.Header.ProposerAddress.String(),
		Timestamp: block.Block.Time,
		Txs:       block.Block.Txs.ToSliceOfBytes(),
	}

	return con.views.RenderBlockView(c, data)
}
