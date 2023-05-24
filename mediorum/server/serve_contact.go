package server

import (
	"os"

	"github.com/labstack/echo/v4"
)

func (ss *MediorumServer) serveContact(c echo.Context) error {
	email := os.Getenv("nodeOperatorEmailAddress")
	if email == "" {
		return c.String(200, "Email address unavailable at the moment")
	}
	return c.String(200, email)
}
