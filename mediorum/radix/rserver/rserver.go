package rserver

import (
	"context"
	"crypto/ecdsa"
	"log"
	"mediorum/ethcontracts"
	"mediorum/radix"
	"mediorum/server"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "embed"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/exp/slog"
)

type RadixConfig struct {
	ListenPort string
	Self       server.Peer
	Peers      []server.Peer

	PrivateKey string            `json:"-"`
	privateKey *ecdsa.PrivateKey // TODO: auth + ratelimit requests that use a lot of bandwidth
}

type RadixServer struct {
	echo   *echo.Echo
	logger *slog.Logger
	quit   chan os.Signal
	radix  *radix.Radix
	Config *RadixConfig
}

var (
	apiBasePath = "/radix"
)

const PercentSeededThreshold = 50

func New(config RadixConfig) (*RadixServer, error) {
	if pk, err := ethcontracts.ParsePrivateKeyHex(config.PrivateKey); err != nil {
		log.Println("invalid private key: ", err)
	} else {
		config.privateKey = pk
	}

	logger := slog.With("myHost", config.Self.Host)

	echoServer := echo.New()
	echoServer.HideBanner = true
	echoServer.Debug = true
	echoServer.Use(middleware.Recover())
	echoServer.Use(middleware.Logger())

	otherHosts := make([]string, len(config.Peers))
	for i, peer := range config.Peers {
		otherHosts[i] = peer.Host
	}

	rs := &RadixServer{
		echo:   echoServer,
		logger: logger,
		quit:   make(chan os.Signal, 1),

		radix: radix.New(config.Self.Host, otherHosts),

		Config: &config,
	}

	// routes holds all of our handled routes
	routes := echoServer.Group(apiBasePath)
	routes.Use(middleware.CORS()) // TODO: can this be removed?

	routes.GET("/info", rs.serveRadixInfo)
	routes.GET("/info/:cid", rs.radix.ServeCIDInfo)
	routes.GET("/cids", rs.radix.ServeTreePaginated)

	// TODO: add auth middleware to these internal routes
	routes.POST("/internal/setHostHasCID", rs.handleSetHostHasCID)
	routes.POST("/internal/setHostNotHasCID", rs.handleSetHostNotHasCID)
	routes.GET("/internal/leaves", rs.radix.ServeTreePaginatedInternal)

	return rs, nil
}

func (rs *RadixServer) MustStart() {
	// start server
	go func() {
		err := rs.echo.Start(":" + rs.Config.ListenPort)
		if err != nil && err != http.ErrServerClosed {
			panic(err)
		}
	}()

	// keep our knowledge of other hosts' CIDs up to date
	go rs.fetchCIDsFromNetwork()

	// wait for shutdown signal
	signal.Notify(rs.quit, os.Interrupt, syscall.SIGTERM)
	<-rs.quit
	close(rs.quit)

	rs.Stop()
}

func (rs *RadixServer) Stop() {
	rs.logger.Debug("stopping")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := rs.echo.Shutdown(ctx); err != nil {
		rs.logger.Error("echo shutdown", "err", err)
	}

	rs.logger.Debug("bye")
}

func (rs *RadixServer) serveRadixInfo(c echo.Context) error {
	type resp struct {
		NumCIDsOnMyHost uint
		NumCIDsTotal    uint
	}
	return c.JSON(http.StatusOK, resp{
		NumCIDsOnMyHost: rs.radix.NumCIDsOnMyHost,
		NumCIDsTotal:    rs.radix.NumCIDsTotal,
		// TODO: include last time it was updated / fully updated from repair.go, or just let healthz reference /health_check. But might be good to have this info to know if it should re-fetch the whole list or just a delta in the future.
	})
}

func (rs *RadixServer) handleSetHostHasCID(c echo.Context) error {
	host := c.FormValue("host")
	cid := c.FormValue("cid")
	rs.radix.SetHostHasCID(host, cid)
	return c.String(http.StatusOK, "")
}

func (rs *RadixServer) handleSetHostNotHasCID(c echo.Context) error {
	host := c.FormValue("host")
	cid := c.FormValue("cid")
	rs.radix.SetHostNotHasCID(host, cid)
	return c.String(http.StatusOK, "")
}

func (rs *RadixServer) fetchCIDsFromNetwork() {
	for _, peer := range rs.Config.Peers {
		if peer.Host != rs.Config.Self.Host {
			rs.radix.InsertOtherHostsView(peer.Host, 100000)
		}
	}

	ticker := time.NewTicker(6 * time.Hour)
	for range ticker.C {
		for _, peer := range rs.Config.Peers {
			if peer.Host != rs.Config.Self.Host {
				rs.radix.InsertOtherHostsView(peer.Host, 100000)
			}
		}
	}
}
