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

	routes := echoServer.Group(apiBasePath)
	routes.GET("/info", rs.serveRadixInfo)
	routes.GET("/cid/:cid", rs.radix.ServeCIDInfo)
	routes.GET("/cids", rs.radix.ServeTreePaginated)
	routes.GET("/cids/onlyOn/count", rs.radix.ServeNumCIDsOnOnlyHosts)
	routes.GET("/cids/onlyOn", rs.radix.ServeCIDsOnOnlyHostsPaginated)
	routes.GET("/replication", rs.radix.ServeReplicationCounts)
	routes.GET("/replication/factor/:replicationFactor", rs.radix.ServeReplicationCIDsPaginated)

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
	go rs.gossipTreeUpdates()

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

func (rs *RadixServer) gossipTreeUpdates() {
	rs.fetchCIDsFromNetwork(true)
	ticker := time.NewTicker(10 * time.Minute)
	for range ticker.C {
		rs.fetchCIDsFromNetwork(false)
	}
}

// TODO: this is how mediorum gossips. really it should do like a n/2 instead of every node repeating CIDs that other nodes are already up-to-date about
func (rs *RadixServer) fetchCIDsFromNetwork(resetCursor bool) {
	for _, peer := range rs.Config.Peers {
		if peer.Host != rs.Config.Self.Host {
			rs.radix.InsertOtherHostsView(peer.Host, 100000, resetCursor)
		}
	}
}
