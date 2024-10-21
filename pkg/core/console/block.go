package console

import (
	"strconv"

	"github.com/AudiusProject/audius-protocol/pkg/core/console/views/pages"
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
		txs = append(txs, tx.TxResult)
	}

	data := &pages.BlockView{
		Height:    block.Height,
		Timestamp: block.CreatedAt.Time,
		Txs:       txs,
	}

	return con.views.RenderBlockView(c, data)
}
