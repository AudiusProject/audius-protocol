package console

import (
	"github.com/AudiusProject/audius-protocol/core/console/components"
	"github.com/AudiusProject/audius-protocol/core/console/utils"
	"github.com/labstack/echo/v4"
)

func (cs *Console) homePage(c echo.Context) error {
	// ctx := c.Request().Context()

	return utils.Render(c, components.HomePage(components.HomePageProps{}))
}
