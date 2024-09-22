package console

import "github.com/labstack/echo/v4"

func (con *Console) nodesPage(c echo.Context) error {
	return c.String(200, "all nodes")
}
