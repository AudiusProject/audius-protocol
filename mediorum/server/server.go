package server

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"log"
	"mediorum/cidutil"
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
	_ "net/http/pprof"

	"github.com/erni27/imcache"
	"github.com/imroc/req/v3"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gocloud.dev/blob"
	"golang.org/x/exp/slog"

	_ "gocloud.dev/blob/fileblob"
)

type Peer struct {
	Host   string `json:"host"`
	Wallet string `json:"wallet"`
}

type VersionJson struct {
	Version string `json:"version"`
	Service string `json:"service"`
}

type MediorumConfig struct {
	Env                  string
	Self                 Peer
	Peers                []Peer
	Signers              []Peer
	ReplicationFactor    int
	Dir                  string `default:"/tmp/mediorum"`
	BlobStoreDSN         string `json:"-"`
	MoveFromBlobStoreDSN string `json:"-"`
	PostgresDSN          string `json:"-"`
	PrivateKey           string `json:"-"`
	ListenPort           string
	TrustedNotifierID    int
	SPID                 int
	SPOwnerWallet        string
	GitSHA               string
	AudiusDockerCompose  string
	AutoUpgradeEnabled   bool
	WalletIsRegistered   bool
	StoreAll             bool
	VersionJson          VersionJson
	MigrateQmCidIters    int

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
	reqClient       *req.Client

	// simplify
	mediorumPathUsed uint64
	mediorumPathSize uint64
	mediorumPathFree uint64

	databaseSize          uint64
	dbSizeErr             string
	lastSuccessfulRepair  RepairTracker
	lastSuccessfulCleanup RepairTracker

	uploadsCount    int64
	uploadsCountErr string

	isSeeding bool

	peerHealthsMutex      sync.RWMutex
	peerHealths           map[string]*PeerHealth
	unreachablePeers      []string
	redirectCache         *imcache.Cache[string, string]
	uploadOrigCidCache    *imcache.Cache[string, string]
	failsPeerReachability bool

	StartedAt time.Time
	Config    MediorumConfig

	crudSweepMutex sync.Mutex
}

type PeerHealth struct {
	LastReachable  time.Time            `json:"lastReachable"`
	LastHealthy    time.Time            `json:"lastHealthy"`
	ReachablePeers map[string]time.Time `json:"reachablePeers"`
}

var (
	apiBasePath = ""
)

const PercentSeededThreshold = 50

func New(config MediorumConfig) (*MediorumServer, error) {
	if env := os.Getenv("MEDIORUM_ENV"); env != "" {
		config.Env = env
	}

	if config.VersionJson == (VersionJson{}) {
		log.Fatal(".version.json is required to be bundled with the mediorum binary")
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
		config.BlobStoreDSN = "file://" + config.Dir + "/blobs?no_tmp_dir=true"
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

	logger := slog.With("self", config.Self.Host)

	// ensure dir
	if err := os.MkdirAll(config.Dir, os.ModePerm); err != nil {
		logger.Error("failed to create local persistent storage dir", "err", err)
	}

	// bucket
	bucket, err := persistence.Open(config.BlobStoreDSN)
	if err != nil {
		logger.Error("failed to open persistent storage bucket", "err", err)
		return nil, err
	}

	// bucket to move all files from
	if config.MoveFromBlobStoreDSN != "" {
		if config.MoveFromBlobStoreDSN == config.BlobStoreDSN {
			logger.Error("AUDIUS_STORAGE_DRIVER_URL_MOVE_FROM cannot be the same as AUDIUS_STORAGE_DRIVER_URL")
			return nil, err
		}
		bucketToMoveFrom, err := persistence.Open(config.MoveFromBlobStoreDSN)
		if err != nil {
			logger.Error("Failed to open bucket to move from. Ensure AUDIUS_STORAGE_DRIVER_URL and AUDIUS_STORAGE_DRIVER_URL_MOVE_FROM are set (the latter can be empty if not moving data)", "err", err)
			return nil, err
		}

		logger.Info(fmt.Sprintf("Moving all files from %s to %s. This may take a few hours...", config.MoveFromBlobStoreDSN, config.BlobStoreDSN))
		err = persistence.MoveAllFiles(bucketToMoveFrom, bucket)
		if err != nil {
			logger.Error("Failed to move files. Ensure AUDIUS_STORAGE_DRIVER_URL and AUDIUS_STORAGE_DRIVER_URL_MOVE_FROM are set (the latter can be empty if not moving data)", "err", err)
			return nil, err
		}

		logger.Info("Finished moving files between buckets. Please remove AUDIUS_STORAGE_DRIVER_URL_MOVE_FROM from your environment and restart the server.")
	}

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
	dbMigrate(crud, bucket, config.Self.Host)

	// req.cool http client
	reqClient := req.C().
		SetUserAgent("mediorum " + config.Self.Host).
		SetTimeout(5 * time.Second)

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

	echoServer.Use(middleware.Recover())
	echoServer.Use(middleware.Logger())
	echoServer.Use(middleware.CORS())
	echoServer.Use(middleware.Gzip())

	ss := &MediorumServer{
		echo:            echoServer,
		bucket:          bucket,
		crud:            crud,
		pgPool:          pgPool,
		reqClient:       reqClient,
		logger:          logger,
		quit:            make(chan os.Signal, 1),
		trustedNotifier: &trustedNotifier,
		isSeeding:       config.Env == "stage" || config.Env == "prod",

		peerHealths:        map[string]*PeerHealth{},
		redirectCache:      imcache.New[string, string](imcache.WithMaxEntriesOption[string, string](50_000)),
		uploadOrigCidCache: imcache.New[string, string](imcache.WithMaxEntriesOption[string, string](50_000)),

		StartedAt: time.Now().UTC(),
		Config:    config,
	}

	routes := echoServer.Group(apiBasePath)

	routes.GET("", func(c echo.Context) error {
		if config.Env == "prod" {
			return c.Redirect(http.StatusMovedPermanently, "/health_check")
		}
		return c.Redirect(http.StatusMovedPermanently, "/dashboard/services/content-node?endpoint="+config.Self.Host)
	})
	routes.GET("/", func(c echo.Context) error {
		if config.Env == "prod" {
			return c.Redirect(http.StatusMovedPermanently, "/health_check")
		}
		return c.Redirect(http.StatusMovedPermanently, "/dashboard/services/content-node?endpoint="+config.Self.Host)
	})

	// public: uploads
	routes.GET("/uploads", ss.serveUploadList)
	routes.GET("/uploads/:id", ss.serveUploadDetail, ss.requireHealthy)
	routes.POST("/uploads/:id", ss.updateUpload, ss.requireHealthy, ss.requireUserSignature)
	routes.POST("/uploads", ss.postUpload, ss.requireHealthy)
	// workaround because reverse proxy catches the browser's preflight OPTIONS request instead of letting our CORS middleware handle it
	routes.OPTIONS("/uploads", func(c echo.Context) error {
		return c.NoContent(http.StatusNoContent)
	})

	// serve blob (audio)
	routes.HEAD("/ipfs/:cid", ss.serveBlob, ss.requireHealthy, ss.ensureNotDelisted)
	routes.GET("/ipfs/:cid", ss.serveBlob, ss.requireHealthy, ss.ensureNotDelisted)
	routes.HEAD("/content/:cid", ss.serveBlob, ss.requireHealthy, ss.ensureNotDelisted)
	routes.GET("/content/:cid", ss.serveBlob, ss.requireHealthy, ss.ensureNotDelisted)
	routes.HEAD("/tracks/cidstream/:cid", ss.serveBlob, ss.requireHealthy, ss.ensureNotDelisted, ss.requireRegisteredSignature)
	routes.GET("/tracks/cidstream/:cid", ss.serveBlob, ss.requireHealthy, ss.ensureNotDelisted, ss.requireRegisteredSignature)

	// serve image
	routes.HEAD("/ipfs/:jobID/:variant", ss.serveImage, ss.requireHealthy)
	routes.GET("/ipfs/:jobID/:variant", ss.serveImage, ss.requireHealthy)
	routes.HEAD("/content/:jobID/:variant", ss.serveImage, ss.requireHealthy)
	routes.GET("/content/:jobID/:variant", ss.serveImage, ss.requireHealthy)

	routes.GET("/contact", ss.serveContact)
	routes.GET("/health_check", ss.serveHealthCheck)
	routes.HEAD("/health_check", ss.serveHealthCheck)
	routes.GET("/ip_check", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"data": c.RealIP(), // client/requestor IP
		})
	})

	routes.GET("/delist_status/track/:trackCid", ss.serveTrackDelistStatus)
	routes.GET("/delist_status/user/:userId", ss.serveUserDelistStatus)
	routes.POST("/delist_status/insert", ss.serveInsertDelistStatus, ss.requireBodySignedByOwner)

	// -------------------
	// healthz
	healthz := routes.Group("/healthz")
	healthzUrl, err := url.Parse("http://healthz")
	if err != nil {
		log.Fatal("Invalid healthz URL: ", err)
	}
	healthzProxy := httputil.NewSingleHostReverseProxy(healthzUrl)
	healthz.Any("*", echo.WrapHandler(healthzProxy))

	// -------------------
	// internal
	internalApi := routes.Group("/internal")

	// internal: crud
	internalApi.GET("/crud/sweep", ss.serveCrudSweep)
	internalApi.POST("/crud/push", ss.serveCrudPush, middleware.BasicAuth(ss.checkBasicAuth))

	internalApi.GET("/blobs/location/:cid", ss.serveBlobLocation, cidutil.UnescapeCidParam)
	internalApi.GET("/blobs/info/:cid", ss.serveBlobInfo, cidutil.UnescapeCidParam)

	// internal: blobs between peers
	internalApi.GET("/blobs/:cid", ss.serveInternalBlobGET, cidutil.UnescapeCidParam, middleware.BasicAuth(ss.checkBasicAuth))
	internalApi.POST("/blobs", ss.serveInternalBlobPOST, middleware.BasicAuth(ss.checkBasicAuth))

	// WIP internal: metrics
	internalApi.GET("/metrics", ss.getMetrics)
	internalApi.GET("/logs/partition-ops", ss.getPartitionOpsLog)
	internalApi.GET("/logs/reaper", ss.getReaperLog)
	internalApi.GET("/logs/repair", ss.serveRepairLog)
	internalApi.GET("/logs/storageAndDb", ss.serveStorageAndDbLogs)

	// internal: testing
	internalApi.GET("/proxy_health_check", ss.proxyHealthCheck)

	return ss, nil

}

func (ss *MediorumServer) MustStart() {

	// start pprof server
	go func() {
		log.Println(http.ListenAndServe(":6060", nil))
	}()

	// start server
	go func() {
		err := ss.echo.Start(":" + ss.Config.ListenPort)
		if err != nil && err != http.ErrServerClosed {
			panic(err)
		}
	}()

	go ss.startTranscoder()

	zeroTime := time.Time{}
	var lastSuccessfulRepair RepairTracker
	err := ss.crud.DB.
		Where("finished_at is not null and finished_at != ? and aborted_reason = ?", zeroTime, "").
		Order("started_at desc").
		First(&lastSuccessfulRepair).Error
	if err != nil {
		lastSuccessfulRepair = RepairTracker{Counters: map[string]int{}}
	}
	ss.lastSuccessfulRepair = lastSuccessfulRepair

	var lastSuccessfulCleanup RepairTracker
	err = ss.crud.DB.
		Where("finished_at is not null and finished_at != ? and aborted_reason = ? and cleanup_mode = true", zeroTime, "").
		Order("started_at desc").
		First(&lastSuccessfulCleanup).Error
	if err != nil {
		lastSuccessfulCleanup = RepairTracker{Counters: map[string]int{}}
	}
	ss.lastSuccessfulCleanup = lastSuccessfulCleanup

	// for any background task that make authenticated peer requests
	// only start if we have a valid registered wallet
	if ss.Config.WalletIsRegistered {

		go ss.startHealthPoller()

		go ss.startRepairer()

		ss.crud.StartClients()

		go ss.startPollingDelistStatuses()

		go ss.pollForSeedingCompletion()

		go ss.startUploadScroller()

	} else {
		go func() {
			for range time.Tick(10 * time.Second) {
				ss.logger.Warn("node not fully running yet - please register at https://dashboard.audius.org and restart the server")
			}
		}()
	}

	go ss.monitorDiskAndDbStatus()

	go ss.monitorPeerReachability()

	// signals
	signal.Notify(ss.quit, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	<-ss.quit
	close(ss.quit)

	ss.Stop()
}

func (ss *MediorumServer) Stop() {
	ss.logger.Info("stopping")

	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
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

	ss.logger.Info("bye")

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
