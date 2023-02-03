package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func GetTrendingPlaylists(c echo.Context) error {
	return c.String(http.StatusOK, "we havent built this either :(")
}
