package console

import (
	"strconv"

	"github.com/AudiusProject/audius-protocol/pkg/core/console/views/pages"
	abci "github.com/cometbft/cometbft/abci/types"
	gogo_proto "github.com/cosmos/gogoproto/proto"
	"github.com/labstack/echo/v4"
)

func (con *Console) blockPage(c echo.Context) error {
	ctx := c.Request().Context()
	blockID := c.Param("block")

	// if block field is number then use it as height
	// otherwise assume it's block hash
	blockNum, err := strconv.ParseInt(blockID, 10, 64)
	if err != nil {
		return err
	}

	block, err := con.db.GetBlock(ctx, blockNum)
	if err != nil {
		return err
	}

	blockTxs, err := con.db.GetBlockTransactions(ctx, blockNum)
	if err != nil {
		return err
	}

	txs := [][]byte{}
	for _, tx := range blockTxs{
		var result abci.TxResult
		if err := gogo_proto.Unmarshal(tx.TxResult, &result); err != nil {
			return err
		}
		txs = append(txs, result.GetTx())
	}

	data := &pages.BlockView{
		Height:    block.Height,
		Timestamp: block.CreatedAt.Time,
		Txs:       txs,
	}

	return con.views.RenderBlockView(c, data)
}
