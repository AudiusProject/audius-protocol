package console

import (
	"github.com/AudiusProject/audius-protocol/pkg/core/console/views/pages"
	"github.com/labstack/echo/v4"
)

func (cs *Console) overviewPage(c echo.Context) error {
	view := &pages.OverviewPageView{
		Blocks: cs.state.latestBlocks,
		Txs:    cs.state.latestTransactions,
	}

	return cs.views.RenderOverviewView(c, view)
}
