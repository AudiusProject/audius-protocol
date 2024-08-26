package middleware

import (
	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/labstack/echo/v4"
)

func ErrorLoggerMiddleware(logger *common.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			err := next(c)
			if err != nil {
				logger.Errorf("error occurred: %v", err)
			}
			return nil
		}
	}
}
