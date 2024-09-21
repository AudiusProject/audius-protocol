package pages

import (
	"github.com/AudiusProject/audius-protocol/core/console/types"
	"github.com/labstack/echo/v4"
)

func RenderBlockPage(c echo.Context, data *types.BlockPageData) error {
	return BlockPage(data).Render(c.Request().Context(), c.Response().Writer)
}

func RenderHomePage(c echo.Context) error {
	return HomePage().Render(c.Request().Context(), c.Response().Writer)
}
