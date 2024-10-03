package console

import (
	"fmt"

	"github.com/labstack/echo/v4"
)

func (con *Console) navChainData(c echo.Context) error {
	totalBlocks := fmt.Sprint(con.state.totalBlocks)
	totalTxs := fmt.Sprint(con.state.totalTransactions)

	// once synced don't ask comet again
	if !con.state.isSyncing {
		return con.views.RenderNavChainData(c, totalBlocks, totalTxs, con.state.isSyncing)
	}

	status, err := con.rpc.Status(c.Request().Context())
	if err == nil {
		con.state.isSyncing = status.SyncInfo.CatchingUp
	}
	return con.views.RenderNavChainData(c, totalBlocks, totalTxs, con.state.isSyncing)
}
