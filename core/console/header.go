package console

import (
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/console/utils"
	"github.com/labstack/echo/v4"
)

func (cs *Console) headerInfo(c echo.Context) error {
	ctx := c.Request().Context()

	tx, err := cs.db.TotalTxResults(ctx)
	if err != nil {
		cs.logger.Errorf("err getting tx: %v", err)
		return err
	}

	status, err := cs.rpc.Status(ctx)
	if err != nil {
		cs.logger.Errorf("err getting status: %v", err)
		return err
	}

	comp := cs.c.HeaderInfo(fmt.Sprint(status.SyncInfo.LatestBlockHeight), fmt.Sprint(tx))
	return utils.Render(c, comp)
}
