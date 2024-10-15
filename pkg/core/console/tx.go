package console

import (
	"fmt"
	"strings"

	"github.com/AudiusProject/audius-protocol/pkg/core/console/views/pages"
	abci "github.com/cometbft/cometbft/abci/types"
	gogo_proto "github.com/cosmos/gogoproto/proto"
	"github.com/labstack/echo/v4"
)

func (con *Console) txPage(c echo.Context) error {
	ctx := c.Request().Context()
	txhash := c.Param("tx")

	tx, err := con.db.GetTx(ctx, strings.ToUpper(txhash))
	if err != nil {
		con.logger.Errorf("err getting tx: %v", err)
		return err
	}

	var result abci.TxResult
	if err := gogo_proto.Unmarshal(tx.TxResult, &result); err != nil {
		return err
	}

	data := &pages.TxView{
		Hash:      txhash,
		Block:     fmt.Sprint(tx.BlockID),
		Timestamp: tx.CreatedAt.Time,
		Tx:        result.Tx,
	}

	return con.views.RenderTxView(c, data)
}
