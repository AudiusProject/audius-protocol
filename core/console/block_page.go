package console

import (
	"encoding/hex"
	"strconv"
	"strings"
	"time"

	"github.com/AudiusProject/audius-protocol/core/console/htmlviews"
	"github.com/AudiusProject/audius-protocol/core/console/jsonviews"
	"github.com/AudiusProject/audius-protocol/core/console/utils"
	coretypes "github.com/cometbft/cometbft/rpc/core/types"
	"github.com/labstack/echo/v4"
)

type BlockPage struct {
	Hash      string                   `json:"block_hash"`
	Height    int64                    `json:"block_height"`
	Timestamp time.Time                `json:"block_time"`
	Txs       []map[string]interface{} `json:"transactions"`
}

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

	if utils.ShouldRenderJSON(c) {
		return jsonviews.BlockPageJSON(c, block)
	}
	return htmlviews.BlockPageHTML(c, block)
}
