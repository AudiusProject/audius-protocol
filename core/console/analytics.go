package console

import (
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/console/views/pages"
	"github.com/AudiusProject/audius-protocol/core/grpc"
	"github.com/labstack/echo/v4"
)

func (con *Console) analyticsPage(c echo.Context) error {
	ctx := c.Request().Context()

	totalBlocks, err := con.db.TotalBlocks(ctx)
	if err != nil {
		return err
	}

	totalTxs, err := con.db.TotalTransactions(ctx)
	if err != nil {
		return err
	}

	totalPlays, err := con.db.TotalTransactionsByType(ctx, grpc.TrackPlaysProtoName)
	if err != nil {
		return err
	}

	totalValidators, err := con.db.TotalValidators(ctx)
	if err != nil {
		return nil
	}

	data := &pages.AnalyticsPageView{
		TotalBlocks:       fmt.Sprint(totalBlocks),
		TotalTransactions: fmt.Sprint(totalTxs),
		TotalPlays:        fmt.Sprint(totalPlays),
		TotalValidators:   fmt.Sprint(totalValidators),
	}
	return con.views.RenderAnalyticsView(c, data)
}
