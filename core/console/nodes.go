package console

import "github.com/labstack/echo/v4"

func (con *Console) nodePage(c echo.Context) error {
	return con.views.RenderNodeView(c)
}

func (con *Console) nodesPage(c echo.Context) error {
	return con.views.RenderNodesView(c)
}
