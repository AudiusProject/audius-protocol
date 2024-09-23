package console

import (
	"strings"

	"github.com/AudiusProject/audius-protocol/core/console/views/layout"
	"github.com/labstack/echo/v4"
)

func (con *Console) render(c echo.Context) error {
	path := fragmentBaseURL + strings.TrimPrefix(c.Request().RequestURI, baseURL)
	con.logger.Info("render route", "path", path)
	return con.layouts.RenderSiteFrame(c, layout.SiteFrameProps{
		Path: path,
	})
}
