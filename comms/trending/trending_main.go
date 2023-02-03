package trending

import (
	"log"

	"comms.audius.co/trending/api"
	"github.com/labstack/echo/v4"
)

func TrendingMain() {
	e := echo.New()

	// trending routes
	e.GET("/tracks/trending", api.GetTrendingTracks)
	e.GET("/playlists/trending", api.GetTrendingPlaylists)

	log.Fatal(e.Start(":8927"))
}
