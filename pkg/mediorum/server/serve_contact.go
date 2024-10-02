package server

import (
	"os"

	"github.com/labstack/echo/v4"
)

type ContactResponse struct {
	Email string `json:"email"`
}

func (ss *MediorumServer) serveContact(c echo.Context) error {
	if ss.trustedNotifier != nil {
		return c.JSON(200, ContactResponse{Email: ss.trustedNotifier.Email})
	}

	email := os.Getenv("nodeOperatorEmailAddress")
	if email == "" {
		return c.String(200, "Email address unavailable at the moment")
	}
	return c.JSON(200, ContactResponse{Email: email})
}
