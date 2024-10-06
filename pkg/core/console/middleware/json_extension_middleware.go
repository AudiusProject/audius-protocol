package middleware

import (
	"strings"

	"github.com/labstack/echo/v4"
)

const jsonSuffix = ".json"

func JsonExtensionMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		if strings.HasSuffix(c.Request().URL.Path, jsonSuffix) {
			c.Request().URL.Path = strings.TrimSuffix(c.Request().URL.Path, jsonSuffix)
			paramValues := c.ParamValues()
			for i, val := range paramValues {
				paramValues[i] = strings.TrimSuffix(val, jsonSuffix)
			}
			c.SetParamValues(paramValues...)
			c.Request().Header.Set(echo.HeaderAccept, echo.MIMEApplicationJSON)
		}
		return next(c)
	}
}
