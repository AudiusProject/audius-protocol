package console

import "github.com/labstack/echo/v4"

func (con *Console) contentFragment(c echo.Context) error {
	return con.views.RenderContentView(c)
}
