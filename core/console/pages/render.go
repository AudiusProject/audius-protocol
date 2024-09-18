package pages

import (
	"context"
	"net/http"

	"github.com/a-h/templ"
	"github.com/labstack/echo/v4"
)

type CanRender interface {
	RenderHTML(c echo.Context) error
	RenderJSON(c echo.Context) error
}

func ShouldRenderJSON(c echo.Context) bool {
	return c.Request().Header.Get(echo.HeaderAccept) == echo.MIMEApplicationJSON
}

func Render(c echo.Context, t templ.Component) error {
	err := t.Render(context.Background(), c.Response().Writer)
	if err != nil {
		return c.String(http.StatusInternalServerError, "failed to render response template")
	}
	return nil
}
