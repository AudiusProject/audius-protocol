package trending

import (
	"net/http"

	"comms.audius.co/trending/config"
	"comms.audius.co/trending/db"
	"github.com/labstack/echo/v4"
)

type TrendingServer struct {
	Database  db.DB
	WebServer *echo.Echo
	Conf      config.Config
}

func NewTrendingServer(conf config.Config) (*TrendingServer, error) {
	wsv := echo.New()
	wsv.Debug = true

	// can swap with any DB type
	db, err := db.NewClickHouseDB(conf)

	if err != nil {
		return nil, err
	}

	return &TrendingServer{
		WebServer: wsv,
		Database:  db,
		Conf:      conf,
	}, nil
}

func (ts *TrendingServer) Run() error {
	wsv := ts.WebServer

	wsv.GET("/tracks/trending", ts.GetTrendingTracks)
	wsv.GET("/playlists/trending", ts.GetTrendingPlaylists)
	wsv.GET("/trending/health", ts.GetHealth)

	return wsv.Start(ts.Conf.WebServerPort)
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
