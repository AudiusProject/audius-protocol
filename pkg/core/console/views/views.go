package views

import (
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/console/views/layout"
	"github.com/AudiusProject/audius-protocol/pkg/core/console/views/pages"
	"github.com/labstack/echo/v4"
)

type Views struct {
	pages   *pages.Pages
	layouts *layout.Layout
}

func NewViews(config *config.Config, baseUrl string) *Views {
	return &Views{
		pages:   pages.NewPages(config, baseUrl),
		layouts: layout.NewLayout(config, baseUrl),
	}
}

func (v *Views) RenderNavChainData(c echo.Context, totalBlocks, totalTxs string, syncing bool) error {
	return v.layouts.NavBlockData(totalBlocks, totalTxs, syncing).Render(c.Request().Context(), c.Response().Writer)
}

func (v *Views) RenderOverviewView(c echo.Context, data *pages.OverviewPageView) error {
	return v.pages.OverviewPageHTML(data).Render(c.Request().Context(), c.Response().Writer)
}

func (v *Views) RenderNodesView(c echo.Context, view *pages.NodesView) error {
	return v.pages.NodesPageHTML(view).Render(c.Request().Context(), c.Response().Writer)
}

func (v *Views) RenderNodeView(c echo.Context, view *pages.NodePageView) error {
	return v.pages.NodePageHTML(view).Render(c.Request().Context(), c.Response().Writer)
}

func (v *Views) RenderAnalyticsView(c echo.Context, view *pages.AnalyticsPageView) error {
	return v.pages.AnalyticsPageHTML(view).Render(c.Request().Context(), c.Response().Writer)
}

func (v *Views) RenderAnalyticsHeader(c echo.Context, totalBlocks string, totalTransactions string, totalPlays string, totalManageEntities string, totalValidators string) error {
	return v.pages.AnalyticsHeaderHTML(totalBlocks, totalTransactions, totalPlays, totalManageEntities, totalValidators).Render(c.Request().Context(), c.Response().Writer)
}

func (v *Views) RenderContentView(c echo.Context) error {
	return v.pages.ContentPageHTML().Render(c.Request().Context(), c.Response().Writer)
}

func (v *Views) RenderUptimeView(c echo.Context, data *pages.UptimePageView) error {
	return v.pages.UptimePageHTML(data).Render(c.Request().Context(), c.Response().Writer)
}

func (v *Views) RenderStorageProofView(c echo.Context, data *pages.StorageProofPageView) error {
	return v.pages.StorageProofPageHTML(data).Render(c.Request().Context(), c.Response().Writer)
}

func (v *Views) RenderErrorView(c echo.Context, errorID string) error {
	return v.pages.ErrorPageHTML(errorID).Render(c.Request().Context(), c.Response().Writer)
}

func (v *Views) RenderGenesisView(c echo.Context, g map[string]interface{}) error {
	return v.pages.GenesisHTML(g).Render(c.Request().Context(), c.Response().Writer)
}

func (v *Views) RenderBlockView(c echo.Context, view *pages.BlockView) error {
	if v.shouldRenderJSON(c) {
		res, err := v.pages.BlockPageJSON(view)
		if err != nil {
			return err
		}
		return c.JSON(200, res)
	}
	return v.pages.BlockPageHTML(view).Render(c.Request().Context(), c.Response().Writer)
}

func (v *Views) RenderTxView(c echo.Context, view *pages.TxView) error {
	if v.shouldRenderJSON(c) {
		res, err := v.pages.TxPageJSON(view)
		if err != nil {
			return err
		}
		return c.JSON(200, res)
	}
	return v.pages.TxPageHTML(view).Render(c.Request().Context(), c.Response().Writer)
}

func (v *Views) shouldRenderJSON(c echo.Context) bool {
	return c.Request().Header.Get(echo.HeaderAccept) == echo.MIMEApplicationJSON
}
