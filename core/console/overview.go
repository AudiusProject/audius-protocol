package console

import (
	"github.com/labstack/echo/v4"
)

func (con *Console) overviewPage(c echo.Context) error {
	return con.render(c)
}

func (con *Console) overviewFragment(c echo.Context) error {
	return c.String(200, "overview")
}
