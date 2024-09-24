package views

import (
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/console/views/pages"
	"github.com/labstack/echo/v4"
)

type Views struct {
	pages *pages.Pages
}

func NewViews(config *config.Config, baseUrl string) *Views {
	return &Views{
		pages: pages.NewPages(config, baseUrl),
	}
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

func (v *Views) shouldRenderJSON(c echo.Context) bool {
	return c.Request().Header.Get(echo.HeaderAccept) == echo.MIMEApplicationJSON
}
