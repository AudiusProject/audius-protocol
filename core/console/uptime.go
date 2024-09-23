package console

import "github.com/labstack/echo/v4"

func (con *Console) uptimePage(c echo.Context) error {
	return con.render(c)
}

func (con *Console) uptimeFragment(c echo.Context) error {
	return c.String(200, "sla auditor will go here :D")
}
