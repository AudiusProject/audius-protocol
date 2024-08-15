package console

import (
	"github.com/AudiusProject/audius-protocol/core/console/components"
	"github.com/AudiusProject/audius-protocol/core/console/utils"
	"github.com/labstack/echo/v4"
)

func (cs *Console) txPage(c echo.Context) error {
	ctx := c.Request().Context()
	txhash := c.Param("tx")

	rpc := cs.rpc
	tx, err := rpc.Tx(ctx, []byte(txhash), false)
	if err != nil {
		return err
	}

	comp := components.TxPage(components.TxPageProps{
		Hash:   txhash,
		Height: tx.Height,
	})
	return utils.Render(c, comp)
}
