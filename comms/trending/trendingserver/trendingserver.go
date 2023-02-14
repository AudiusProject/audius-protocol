package trendingserver

import (
	"net/http"

	"comms.audius.co/trending/config"
	"github.com/labstack/echo/v4"
)

// TrendingServer lives for lifetime of the app
type TrendingServer struct {
	WebServer *echo.Echo
	Conf      config.Config
}

func NewTrendingServer(conf config.Config) (*TrendingServer, error) {
	wsv := echo.New()
	wsv.Debug = conf.Debug

	return &TrendingServer{
		WebServer: wsv,
		Conf:      conf,
	}, nil
}

func (ts *TrendingServer) Run() error {
	wsv := ts.WebServer

	wsv.GET("/tracks/trending", ts.GetTrendingTracks)
	wsv.GET("/playlists/trending", ts.GetTrendingPlaylists)
	wsv.GET("/trending/health", ts.GetHealth)

	return wsv.Start(ts.Conf.FormatEchoPort())
}

func (ts *TrendingServer) GetTrendingTracks(c echo.Context) error {
	return c.String(http.StatusOK, "no tracks are trending yet :)")
}

func (ts *TrendingServer) GetTrendingPlaylists(c echo.Context) error {
	return c.String(http.StatusOK, "no playlists are trending yet :)")
}

func (ts *TrendingServer) GetHealth(c echo.Context) error {
	return c.String(http.StatusOK, "healthy :)")
}
