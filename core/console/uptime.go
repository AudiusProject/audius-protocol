package console

import "github.com/labstack/echo/v4"

func (con *Console) uptimePage(c echo.Context) error {
	return c.String(200, "sla auditor will go here :D")
}
