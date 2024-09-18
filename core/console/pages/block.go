package pages

import (
	"encoding/hex"
	"strconv"
	"strings"

	coretypes "github.com/cometbft/cometbft/rpc/core/types"
	"github.com/davecgh/go-spew/spew"
	"github.com/labstack/echo/v4"
)

type BlockPageData struct {
	Height   string
	Hash     string
	Proposer string
	Txs      [][]byte
}

func (b *BlockPageData) RenderHTML(c echo.Context) error {
	return nil
}

func (b *BlockPageData) RenderJSON(c echo.Context) error {
	return nil
}

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

	spew.Dump(block)

	return c.String(200, "block page")
}
