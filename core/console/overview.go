package console

import (
	"github.com/labstack/echo/v4"
)

func (con *Console) overviewPage(c echo.Context) error {
	return con.views.RenderOverviewView(c)
}
