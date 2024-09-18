package pages

import (
	"net/http"

	"github.com/AudiusProject/audius-protocol/core/console/types"
	"github.com/labstack/echo/v4"
)

func RenderBlockPage(c echo.Context, data *types.BlockPageData) error {
	err := BlockPage(data).Render(c.Request().Context(), c.Response().Writer)
	if err != nil {
		return c.String(http.StatusInternalServerError, "failed to render response template")
	}
	return nil
}
