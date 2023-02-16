package trendingserver

import (
	"net/http"

	"comms.audius.co/trending/config"
	"comms.audius.co/trending/db"
	"github.com/labstack/echo/v4"
)

// TrendingServer lives for lifetime of the app
type TrendingServer struct {
	WebServer *echo.Echo
	Conf      config.Config
	Database  db.DB
}

func NewTrendingServer(conf config.Config) (*TrendingServer, error) {
	wsv := echo.New()
	wsv.Debug = conf.Debug
	wsv.HideBanner = conf.HideBanner

	// can swap with any DB type
	db, err := db.NewClickHouseDB(conf)

	if err != nil {
		return nil, err
	}

	return &TrendingServer{
		WebServer: wsv,
		Conf:      conf,
		Database:  db,
	}, nil
}

func (ts *TrendingServer) Run() error {
	wsv := ts.WebServer

	wsv.GET("/tracks/trending", ts.GetTrendingTracks)
	wsv.GET("/playlists/trending", ts.GetTrendingPlaylists)
	wsv.GET("/trending/health", ts.GetHealth)

	return wsv.Start(ts.Conf.FormatEchoPort())
}

func (ts *TrendingServer) Close() error {
	err := ts.WebServer.Close()
	if err != nil {
		return err
	}
	return nil
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
		return c.String(http.StatusOK, "healthy :)")
	}
	return c.String(http.StatusInternalServerError, "BANG!")
}
