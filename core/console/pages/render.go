package pages

import (
	"github.com/labstack/echo/v4"
)

func shouldRenderJSON(c echo.Context) bool {
	return c.Request().Header.Get(echo.HeaderAccept) == echo.MIMEApplicationJSON
}
