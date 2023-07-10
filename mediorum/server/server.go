package server

import (
	"context"
	"crypto/ecdsa"
	"encoding/json"
	"io/ioutil"
	"log"
	"mediorum/crudr"
	"mediorum/ethcontracts"
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
	VersionJson         VersionJson

	// should have a basedir type of thing
	// by default will put db + blobs there

	StoreAll      bool
	MigrateQmCids bool

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

	peerHealthMutex  sync.RWMutex
	peerHealth       map[string]time.Time
	cachedCidCursors []cidCursor

	StartedAt time.Time
	Config    MediorumConfig
}

var (
	apiBasePath = ""
)

func New(config MediorumConfig) (*MediorumServer, error) {
	if env := os.Getenv("MEDIORUM_ENV"); env != "" {
		config.Env = env
	}

	// parse version.json
	var versionJson VersionJson
	versionJsonFile, err := os.Open(".version.json")
	if err != nil {
		slog.Error("Unable to open .version.json file", "host", config.Self.Host, "err", err)
		if config.IsV2Only {
			panic("Unable to open .version.json file")
		}
	}
	defer versionJsonFile.Close()

	byteValue, _ := ioutil.ReadAll(versionJsonFile)

	err = json.Unmarshal(byteValue, &versionJson)
	if err != nil {
		slog.Error("Unable to parse .version.json file", "host", config.Self.Host, "err", err)
		if config.IsV2Only {
			panic("Unable to parse .version.json file")
		}
	}
	config.VersionJson = versionJson

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
	if strings.HasPrefix(config.BlobStoreDSN, "file://") {
		os.MkdirAll(strings.TrimPrefix(config.BlobStoreDSN, "file://"), os.ModePerm)
	}

	// bucket
	bucket, err := blob.OpenBucket(context.Background(), config.BlobStoreDSN)
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
		log.Println("dial postgres failed", err)
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
			slog.Info("got trusted notifier from chain", "endpoint", trustedNotifier.Endpoint, "wallet", trustedNotifier.Wallet)
		} else {
			slog.Error("failed to get trusted notifier from chain, not polling delist statuses", "err", err)
		}
	} else {
		slog.Warn("trusted notifier id not set, not polling delist statuses or serving /contact route")
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
	routes.GET("/uploads", ss.getUploads)
	routes.GET("/uploads/:id", ss.getUpload)
	routes.POST("/uploads", ss.postUpload)
	// Workaround because reverse proxy catches the browser's preflight OPTIONS request instead of letting our CORS middleware handle it
	routes.OPTIONS("/uploads", func(c echo.Context) error {
		return c.NoContent(http.StatusNoContent)
	})

	routes.GET("/ipfs/:cid", ss.getBlob, ss.ensureNotDelisted)
	routes.GET("/content/:cid", ss.getBlob, ss.ensureNotDelisted)
	routes.GET("/ipfs/:jobID/:variant", ss.getBlobByJobIDAndVariant)
	routes.GET("/content/:jobID/:variant", ss.getBlobByJobIDAndVariant)
	routes.HEAD("/tracks/cidstream/:cid", ss.headBlob, ss.ensureNotDelisted, ss.requireSignature)
	routes.GET("/tracks/cidstream/:cid", ss.getBlob, ss.ensureNotDelisted, ss.requireSignature)
	routes.GET("/contact", ss.serveContact)
	routes.GET("/health_check", ss.serveHealthCheck)

	// todo: use `/internal/ok` instead... this is just needed for transition
	routes.GET("/status", func(c echo.Context) error {
		status := 200
		if !ss.Config.WalletIsRegistered {
			status = 506
		}
		dbHealthy := ss.databaseSize > 0
		if !dbHealthy {
			status = 500
		}
		return c.JSON(status, map[string]any{
			"host":                 ss.Config.Self.Host,
			"wallet":               ss.Config.Self.Wallet,
			"wallet_is_registered": ss.Config.WalletIsRegistered,
		})
	})

	// -------------------
	// internal
	internalApi := routes.Group("/internal")

	// responds to polling requests in peer_health
	// should do no real work
	internalApi.GET("/ok", func(c echo.Context) error {
		dbHealthy := ss.databaseSize > 0
		if !dbHealthy {
			c.JSON(500, "database not healthy")
		}
		return c.String(200, "OK")
	})

	internalApi.GET("/beam/files", ss.servePgBeam)

	// internal: crud
	internalApi.GET("/crud/sweep", ss.serveCrudSweep)
	internalApi.POST("/crud/push", ss.serveCrudPush, middleware.BasicAuth(ss.checkBasicAuth))

	// internal: blobs
	internalApi.GET("/blobs/broken", ss.getBlobBroken)
	internalApi.GET("/blobs/problems", ss.getBlobProblems)

	// TODO: old info route. remove
	internalApi.GET("/blobs/info/:cid", ss.getBlobInfo)

	// new info routes
	internalApi.GET("/blobs/:cid/info", ss.getBlobInfo)

	// internal: blobs between peers
	internalApi.GET("/blobs/:cid", ss.serveInternalBlobPull, middleware.BasicAuth(ss.checkBasicAuth))
	internalApi.POST("/blobs", ss.postBlob, middleware.BasicAuth(ss.checkBasicAuth))

	// WIP internal: metrics
	internalApi.GET("/metrics", ss.getMetrics)

	// reverse proxy stuff
	upstream, _ := url.Parse(config.UpstreamCN)
	proxy := httputil.NewSingleHostReverseProxy(upstream)
	echoServer.Any("*", echo.WrapHandler(proxy))

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

	// for any background task that make authenticated peer requests
	// only start if we have a valid registered wallet
	if ss.Config.WalletIsRegistered {

		go ss.startHealthPoller()

		go ss.startRepairer()

		ss.crud.StartClients()

		go ss.startCidBeamClient()

		go ss.startPollingDelistStatuses()

	}

	go ss.monitorDiskAndDbStatus()

	go ss.monitorCidCursors()

	go ss.startQmCidMigration()

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
