package pages

import (
	"github.com/AudiusProject/audius-protocol/core/console/htmlviews/pages"
	"github.com/labstack/echo/v4"
)

func (p *Pages) homePage(c echo.Context) error {
	return pages.RenderHomePage(c)
}
