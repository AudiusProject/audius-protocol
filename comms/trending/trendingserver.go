package trending

import (
	"net/http"

	"comms.audius.co/trending/db"
	"github.com/labstack/echo/v4"
)

type TrendingServer struct {
	Database  db.DB
	WebServer *echo.Echo
}

func NewTrendingServer() *TrendingServer {
	wsv := echo.New()
	wsv.Debug = true

	// can swap with any DB type
	db := db.NewClickHouseDB()

	return &TrendingServer{
		WebServer: wsv,
		Database:  db,
	}
}

func (ts *TrendingServer) Run(conf Config) error {
	wsv := ts.WebServer

	wsv.GET("/tracks/trending", ts.GetTrendingTracks)
	wsv.GET("/playlists/trending", ts.GetTrendingPlaylists)
	wsv.GET("/trending/health", ts.GetHealth)

	return wsv.Start(conf.WebServerPort)
}

func (ts *TrendingServer) GetTrendingTracks(c echo.Context) error {
	res, err := ts.Database.QueryTrendingTracks()
	if err != nil {
		return err
	}
	return c.String(http.StatusOK, res)
}

func (ts *TrendingServer) GetTrendingPlaylists(c echo.Context) error {
	res, err := ts.Database.QueryTrendingPlaylists()
	if err != nil {
		return err
	}
	return c.String(http.StatusOK, res)
}

func (ts *TrendingServer) GetHealth(c echo.Context) error {
	res := ts.Database.CheckHealth()
	if res {
		return c.String(http.StatusOK, "")
	}
	return c.String(http.StatusInternalServerError, "BANG!")
}
