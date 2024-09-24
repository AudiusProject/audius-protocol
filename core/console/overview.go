package console

import (
	"github.com/AudiusProject/audius-protocol/core/console/views/pages"
	"github.com/labstack/echo/v4"
)

func (cs *Console) overviewPage(c echo.Context) error {
	ctx := c.Request().Context()

	recentBlocks, err := cs.db.GetRecentBlocks(ctx)
	if err != nil {
		return err
	}

	recentTxs, err := cs.db.GetRecentTxs(ctx)
	if err != nil {
		return err
	}

	view := &pages.OverviewPageView{
		Blocks: recentBlocks,
		Txs:    recentTxs,
	}

	return cs.views.RenderOverviewView(c, view)
}
