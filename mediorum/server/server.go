package server

import (
	"context"
	"crypto/ecdsa"
	"log"
	"mediorum/crudr"
	"mediorum/ethcontracts"
	"mediorum/persistence"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	_ "embed"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gocloud.dev/blob"
	_ "gocloud.dev/blob/fileblob"
	"golang.org/x/exp/slog"
)

type Peer struct {
	Host   string `json:"host"`
	Wallet string `json:"wallet"`
}

type VersionJson struct {
	Version string `json:"version"`
	Service string `json:"service"`
}

func (p Peer) ApiPath(parts ...string) string {
	// todo: remove this method, just use apiPath helper everywhere
	parts = append([]string{p.Host}, parts...)
	return apiPath(parts...)
}

type MediorumConfig struct {
	Env                 string
	Self                Peer
	Peers               []Peer
	Signers             []Peer
	ReplicationFactor   int
	Dir                 string `default:"/tmp/mediorum"`
	BlobStoreDSN        string `json:"-"`
	PostgresDSN         string `json:"-"`
	LegacyFSRoot        string `json:"-"`
	PrivateKey          string `json:"-"`
	ListenPort          string
	UpstreamCN          string
	TrustedNotifierID   int
	SPID                int
	SPOwnerWallet       string
	GitSHA              string
	AudiusDockerCompose string
	AutoUpgradeEnabled  bool
	WalletIsRegistered  bool
	IsV2Only            bool
	StoreAll            bool
	VersionJson         VersionJson

	// should have a basedir type of thing
	// by default will put db + blobs there

	privateKey *ecdsa.PrivateKey
}

type MediorumServer struct {
	echo            *echo.Echo
	bucket          *blob.Bucket
	logger          *slog.Logger
	crud            *crudr.Crudr
	pgPool          *pgxpool.Pool
	quit            chan os.Signal
	trustedNotifier *ethcontracts.NotifierInfo
	storagePathUsed uint64
	storagePathSize uint64
	databaseSize    uint64
	isSeeding       bool
	isSeedingLegacy bool

	peerHealthMutex  sync.RWMutex
	peerHealth       map[string]time.Time
	cachedCidCursors []cidCursor

	StartedAt time.Time
	Config    MediorumConfig
}

var (
	apiBasePath = ""
)

const PercentSeededThreshold = 50

func New(config MediorumConfig) (*MediorumServer, error) {
	if env := os.Getenv("MEDIORUM_ENV"); env != "" {
		config.Env = env
	}

	if config.IsV2Only && config.VersionJson == (VersionJson{}) {
		log.Fatal(".version.json is required for v2-only nodes")
	}

	// validate host config
	if config.Self.Host == "" {
		log.Fatal("host is required")
	} else if hostUrl, err := url.Parse(config.Self.Host); err != nil {
		log.Fatal("invalid host: ", err)
	} else if config.ListenPort == "" {
		config.ListenPort = hostUrl.Port()
	}

	if config.Dir == "" {
		config.Dir = "/tmp/mediorum"
	}

	if config.BlobStoreDSN == "" {
		config.BlobStoreDSN = "file://" + config.Dir + "/blobs"
	}

	if pk, err := ethcontracts.ParsePrivateKeyHex(config.PrivateKey); err != nil {
		log.Println("invalid private key: ", err)
	} else {
		config.privateKey = pk
	}

	// check that we're registered...
	for _, peer := range config.Peers {
		if strings.EqualFold(config.Self.Wallet, peer.Wallet) && strings.EqualFold(config.Self.Host, peer.Host) {
			config.WalletIsRegistered = true
			break
		}
	}

	// ensure dir
	os.MkdirAll(config.Dir, os.ModePerm)

	// bucket
	bucket, err := persistence.Open(config.BlobStoreDSN)
	if err != nil {
		return nil, err
	}

	// logger
	logger := slog.With("self", config.Self.Host)

	// db
	db := dbMustDial(config.PostgresDSN)

	// pg pool
	// config.PostgresDSN
	pgConfig, _ := pgxpool.ParseConfig(config.PostgresDSN)
	pgPool, err := pgxpool.NewWithConfig(context.Background(), pgConfig)
	if err != nil {
		logger.Error("dial postgres failed", "err", err)
	}

	// crud
	peerHosts := []string{}
	for _, peer := range config.Peers {
		if peer.Host == config.Self.Host {
			continue
		}
		peerHosts = append(peerHosts, peer.Host)
	}
	crud := crudr.New(config.Self.Host, config.privateKey, peerHosts, db)
	dbMigrate(crud)

	// Read trusted notifier endpoint from chain
	var trustedNotifier ethcontracts.NotifierInfo
	if config.TrustedNotifierID > 0 {
		trustedNotifier, err = ethcontracts.GetNotifierForID(strconv.Itoa(config.TrustedNotifierID), config.Self.Wallet)
		if err == nil {
			logger.Info("got trusted notifier from chain", "endpoint", trustedNotifier.Endpoint, "wallet", trustedNotifier.Wallet)
		} else {
			logger.Error("failed to get trusted notifier from chain, not polling delist statuses", "err", err)
		}
	} else {
		logger.Warn("trusted notifier id not set, not polling delist statuses or serving /contact route")
	}

	// echoServer server
	echoServer := echo.New()
	echoServer.HideBanner = true
	echoServer.Debug = true

	// echoServer is the root server
	// it mostly exists to serve the catch all reverse proxy rule at the end
	// most routes and middleware should be added to the `routes` group
	// mostly don't add CORS middleware here as it will break reverse proxy at the end
	echoServer.Use(middleware.Recover())
	echoServer.Use(middleware.Logger())

	ss := &MediorumServer{
		echo:            echoServer,
		bucket:          bucket,
		crud:            crud,
		pgPool:          pgPool,
		logger:          logger,
		quit:            make(chan os.Signal, 1),
		trustedNotifier: &trustedNotifier,
		isSeeding:       config.Env == "stage" || config.Env == "prod",
		isSeedingLegacy: config.Env == "stage" || config.Env == "prod",

		peerHealth: map[string]time.Time{},

		StartedAt: time.Now().UTC(),
		Config:    config,
	}

	// routes holds all of our handled routes
	// and related middleware like CORS
	routes := echoServer.Group(apiBasePath)
	routes.Use(middleware.CORS())

	if config.Env != "stage" && config.Env != "prod" {
		// public: uis
		routes.GET("", ss.serveUploadUI)
		routes.GET("/", ss.serveUploadUI)
	} else {
		routes.GET("", func(c echo.Context) error {
			return c.Redirect(http.StatusMovedPermanently, "/health_check")
		})
		routes.GET("/", func(c echo.Context) error {
			return c.Redirect(http.StatusMovedPermanently, "/health_check")
		})
	}

	// public: uploads
	routes.GET("/uploads", ss.getUploads, ss.requireHealthy)
	routes.GET("/uploads/:id", ss.getUpload, ss.requireHealthy)
	routes.POST("/uploads/:id", ss.updateUpload, ss.requireHealthy, ss.requireUserSignature)
	routes.POST("/uploads", ss.postUpload, ss.requireHealthy)
	// Workaround because reverse proxy catches the browser's preflight OPTIONS request instead of letting our CORS middleware handle it
	routes.OPTIONS("/uploads", func(c echo.Context) error {
		return c.NoContent(http.StatusNoContent)
	})

	routes.HEAD("/ipfs/:cid", ss.getBlob, ss.requireHealthy, ss.ensureNotDelisted)
	routes.GET("/ipfs/:cid", ss.getBlob, ss.requireHealthy, ss.ensureNotDelisted)
	routes.HEAD("/content/:cid", ss.getBlob, ss.requireHealthy, ss.ensureNotDelisted)
	routes.GET("/content/:cid", ss.getBlob, ss.requireHealthy, ss.ensureNotDelisted)
	routes.HEAD("/ipfs/:jobID/:variant", ss.getBlobByJobIDAndVariant, ss.requireHealthy)
	routes.GET("/ipfs/:jobID/:variant", ss.getBlobByJobIDAndVariant, ss.requireHealthy)
	routes.HEAD("/content/:jobID/:variant", ss.getBlobByJobIDAndVariant, ss.requireHealthy)
	routes.GET("/content/:jobID/:variant", ss.getBlobByJobIDAndVariant, ss.requireHealthy)
	routes.HEAD("/tracks/cidstream/:cid", ss.getBlob, ss.requireHealthy, ss.ensureNotDelisted, ss.requireRegisteredSignature)
	routes.GET("/tracks/cidstream/:cid", ss.getBlob, ss.requireHealthy, ss.ensureNotDelisted, ss.requireRegisteredSignature)
	routes.GET("/contact", ss.serveContact)
	routes.GET("/health_check", ss.serveHealthCheck)
	routes.GET("/ip_check", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"data": c.RealIP(), // client/requestor IP
		})
	})

	// -------------------
	// internal
	internalApi := routes.Group("/internal")

	// TODO: remove after all nodes upgrade to v0.3.98
	routes.GET("/status", func(c echo.Context) error {
		return c.String(200, "OK")
	}, ss.requireHealthy)

	// responds to polling requests in peer_health
	// should do no real work
	internalApi.GET("/ok", func(c echo.Context) error {
		return c.String(200, "OK")
	}, ss.requireHealthy)

	internalApi.GET("/beam/files", ss.servePgBeam)

	internalApi.GET("/cuckoo", ss.serveCuckoo)
	internalApi.GET("/cuckoo/size", ss.serveCuckooSize)
	internalApi.GET("/cuckoo/:cid", ss.serveCuckooLookup)

	// internal: crud
	internalApi.GET("/crud/sweep", ss.serveCrudSweep)
	internalApi.POST("/crud/push", ss.serveCrudPush, middleware.BasicAuth(ss.checkBasicAuth))

	// internal: blobs
	internalApi.GET("/blobs/broken", ss.getBlobBroken)
	internalApi.GET("/blobs/problems", ss.getBlobProblems)

	// old info routes
	// TODO: remove
	internalApi.GET("/blobs/location/:cid", ss.getBlobLocation)
	internalApi.GET("/blobs/info/:cid", ss.getBlobInfo)

	// new info routes
	internalApi.GET("/blobs/:cid/location", ss.getBlobLocation)
	internalApi.GET("/blobs/:cid/info", ss.getBlobInfo)

	// internal: blobs between peers
	internalApi.GET("/blobs/:cid", ss.serveInternalBlobPull, middleware.BasicAuth(ss.checkBasicAuth))
	internalApi.POST("/blobs", ss.postBlob, middleware.BasicAuth(ss.checkBasicAuth))

	// WIP internal: metrics
	internalApi.GET("/metrics", ss.getMetrics)

	// reverse proxy fallback to legacy CN (NodeJS server container)
	if !config.IsV2Only {
		upstream, _ := url.Parse(config.UpstreamCN)
		proxy := httputil.NewSingleHostReverseProxy(upstream)
		echoServer.Any("*", echo.WrapHandler(proxy))
	}

	return ss, nil

}

func (ss *MediorumServer) MustStart() {

	// start server
	go func() {
		err := ss.echo.Start(":" + ss.Config.ListenPort)
		if err != nil && err != http.ErrServerClosed {
			panic(err)
		}
	}()

	go ss.startTranscoder()

	go ss.startCuckooBuilder()
	go ss.startCuckooFetcher()

	// for any background task that make authenticated peer requests
	// only start if we have a valid registered wallet
	if ss.Config.WalletIsRegistered {

		go ss.startHealthPoller()

		go ss.startRepairer()

		ss.crud.StartClients()

		go ss.startCidBeamClient()

		go ss.startPollingDelistStatuses()

		go ss.pollForSeedingCompletion()

	} else {
		go func() {
			for range time.Tick(10 * time.Second) {
				ss.logger.Warn("node not fully running yet - please register at https://dashboard.audius.org and restart the server")
			}
		}()
	}

	go ss.monitorDiskAndDbStatus()

	go ss.monitorCidCursors()

	// signals
	signal.Notify(ss.quit, os.Interrupt, syscall.SIGTERM)
	<-ss.quit
	close(ss.quit)

	ss.Stop()
}

func (ss *MediorumServer) Stop() {
	ss.logger.Debug("stopping")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := ss.echo.Shutdown(ctx); err != nil {
		ss.logger.Error("echo shutdown", "err", err)
	}

	if db, err := ss.crud.DB.DB(); err == nil {
		if err := db.Close(); err != nil {
			ss.logger.Error("db shutdown", "err", err)
		}
	}

	// todo: stop transcode worker + repairer too

	ss.logger.Debug("bye")

}

func (ss *MediorumServer) pollForSeedingCompletion() {
	ticker := time.NewTicker(10 * time.Second)
	for range ticker.C {
		if ss.crud.GetPercentNodesSeeded() > PercentSeededThreshold {
			ss.isSeeding = false
			return
		}
	}
}
