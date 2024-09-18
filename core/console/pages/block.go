package pages

import (
	"encoding/hex"
	"fmt"
	"strconv"
	"strings"

	"github.com/AudiusProject/audius-protocol/core/console/htmlviews/pages"
	"github.com/AudiusProject/audius-protocol/core/console/jsonviews"
	"github.com/AudiusProject/audius-protocol/core/console/types"
	coretypes "github.com/cometbft/cometbft/rpc/core/types"
	"github.com/labstack/echo/v4"
)

func (p *Pages) blockPage(c echo.Context) error {
	ctx := c.Request().Context()
	blockID := c.Param("block")

	rpc := p.rpc

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

	data := &types.BlockPageData{
		Height:   fmt.Sprint(block.Block.Height),
		Hash:     hex.EncodeToString(block.Block.Hash()),
		Proposer: block.Block.Header.ProposerAddress.String(),
		Txs:      block.Block.Txs.ToSliceOfBytes(),
	}

	if shouldRenderJSON(c) {
		return jsonviews.RenderBlockPage(c, data)
	}
	return pages.RenderBlockPage(c, data)
}
