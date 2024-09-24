package console

import "github.com/labstack/echo/v4"

func (con *Console) uptimeFragment(c echo.Context) error {
	return con.views.RenderUptimeView(c)
}
