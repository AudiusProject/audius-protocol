package console

import (
	"encoding/hex"
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/console/views/pages"
	"github.com/labstack/echo/v4"
)

func (cs *Console) overviewPage(c echo.Context) error {
	ctx := c.Request().Context()

	block, err := cs.rpc.Block(ctx, nil)
	if err != nil {
		return err
	}

	recentTxs, err := cs.db.GetRecentTxs(ctx)
	if err != nil {
		return err
	}

	blockData := pages.BlockView{
		Height:    fmt.Sprint(block.Block.Height),
		Hash:      hex.EncodeToString(block.Block.Hash()),
		Proposer:  block.Block.Header.ProposerAddress.String(),
		Timestamp: block.Block.Time,
		Txs:       block.Block.Txs.ToSliceOfBytes(),
	}

	view := &pages.OverviewPageView{
		Block: blockData,
		Txs:   recentTxs,
	}

	return cs.views.RenderOverviewView(c, view)
}
