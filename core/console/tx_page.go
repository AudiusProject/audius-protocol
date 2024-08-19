package console

import (
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/console/components"
	"github.com/AudiusProject/audius-protocol/core/console/utils"
	"github.com/labstack/echo/v4"
)

func (cs *Console) txPage(c echo.Context) error {
	ctx := c.Request().Context()
	txhash := c.Param("tx")

	tx, err := cs.db.GetTx(ctx, txhash)
	if err != nil {
		cs.logger.Errorf("err getting tx: %v", err)
		return err
	}

	comp := components.TxPage(components.TxPageProps{
		Hash:   txhash,
		Height: fmt.Sprint(tx.BlockID),
	})
	return utils.Render(c, comp)
}
