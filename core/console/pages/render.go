package pages

import (
	"net/http"

	"github.com/a-h/templ"
	"github.com/labstack/echo/v4"
)

type CanRender interface {
	RenderHTML(c echo.Context) error
	RenderJSON(c echo.Context) error
}

func render(c echo.Context, page CanRender) error {
	if shouldRenderJSON(c) {
		return page.RenderJSON(c)
	}
	return page.RenderHTML(c)
}

func shouldRenderJSON(c echo.Context) bool {
	return c.Request().Header.Get(echo.HeaderAccept) == echo.MIMEApplicationJSON
}

func renderTempl(c echo.Context, t templ.Component) error {
	err := t.Render(c.Request().Context(), c.Response().Writer)
	if err != nil {
		return c.String(http.StatusInternalServerError, "failed to render response template")
	}
	return nil
}
