package utils

import (
	"github.com/labstack/echo/v4"
)

func ShouldRenderJSON(c echo.Context) bool {
	return c.Request().Header.Get(echo.HeaderAccept) == echo.MIMEApplicationJSON
}
