package console

import (
	"fmt"

	"github.com/labstack/echo/v4"
)

func (con *Console) navChainData(c echo.Context) error {
	totalBlocks := fmt.Sprint(con.state.totalBlocks)
	totalTxs := fmt.Sprint(con.state.totalTransactions)
	return con.views.RenderNavChainData(c, totalBlocks, totalTxs, con.state.isSyncing)
}
