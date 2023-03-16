// Package storageserver lives for the lifetime of the program and mananges connections and route handlers.
package storageserver

import (
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"net/http"
	"strings"
	"time"

	natsdConfig "comms.audius.co/natsd/config"
	sharedConfig "comms.audius.co/shared/config"
	"comms.audius.co/shared/peering"
	"comms.audius.co/storage/config"
	"comms.audius.co/storage/contentaccess"
	"comms.audius.co/storage/decider"
	"comms.audius.co/storage/logstream"
	"comms.audius.co/storage/monitor"
	"comms.audius.co/storage/persistence"
	"comms.audius.co/storage/telemetry"
	"comms.audius.co/storage/transcode"
	"github.com/avast/retry-go"
	"github.com/gobwas/ws"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/nats-io/nats.go"
	"go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho"
	"golang.org/x/exp/slog"
)

const (
	GlobalNamespace    string = "0"
	NumJobWorkers      int    = 3
	HealthyNodesKVName string = "healthyNodes"
)

// StorageServer lives for the lifetime of the program and holds connections and managers.
type StorageServer struct {
	Namespace      string
	Config         *config.StorageConfig
	Host           string
	StorageDecider decider.StorageDecider
	Jsc            nats.JetStreamContext
	JobsManager    *transcode.JobsManager
	Persistence    *persistence.Persistence
	WebServer      *echo.Echo
	Monitor        *monitor.Monitor
	Peering        peering.Peering
	Logstream      *logstream.LogStream
}

func New(cfg *config.StorageConfig, jsc nats.JetStreamContext, peering peering.Peering) (*StorageServer, error) {
	thisNodePubKey := strings.ToLower(cfg.PeeringConfig.Keys.DelegatePublicKey)
	host, err := getStorageHostFromPubKey(thisNodePubKey, peering)
	if err != nil {
		slog.Error("Could not find host for this node. If running locally, check AUDIUS_DEV_ONLY_REGISTERED_NODES", err)
		return nil, err
	}

	if host == "" {
		return nil, errors.New("could not find host for this node. If running locally, check AUDIUS_DEV_ONLY_REGISTERED_NODES")
	}

	var healthyNodesKV nats.KeyValue
	err = retry.Do(
		func() error {
			var err error
			healthyNodesKV, err = jsc.CreateKeyValue(&nats.KeyValueConfig{
				Bucket:      HealthyNodesKVName,
				Description: "Source of truth where every node reads the list of healthy nodes from",
				History:     20,
				Replicas:    natsdConfig.NatsReplicaCount,
				Placement:   config.StoragePlacement(),
			})
			if err != nil {
				return err
			}
			return nil
		},
	)
	if err != nil {
		slog.Error("failed to create healthyNodes KV", err)
		return nil, err
	}

	logstream, err := logstream.New(GlobalNamespace, thisNodePubKey, jsc)
	if err != nil {
		return nil, fmt.Errorf("error creating logstream: %v", err)
	}

	m := monitor.New(GlobalNamespace, healthyNodesKV, logstream, cfg.HealthTTLHours, jsc)
	err = m.UpdateHealthyNodeSetOnInterval(cfg.RebalanceIntervalHours)
	if err != nil {
		slog.Error("error starting interval to update set of healthy nodes", err)
		return nil, err
	}

	d := decider.NewRendezvousDecider(
		GlobalNamespace,
		natsdConfig.NatsReplicaCount,
		thisNodePubKey,
		healthyNodesKV,
		logstream,
		jsc,
	)
	jobsManager, err := transcode.NewJobsManager(jsc, GlobalNamespace)
	if err != nil {
		slog.Error("error creating jobs manager", err)
		return nil, err
	}
	jobsManager.StartWorkers(NumJobWorkers)

	persistence, err := persistence.New(thisNodePubKey, "KV_"+GlobalNamespace+transcode.KvSuffix, cfg.StorageDriverUrl, d, jsc)
	if err != nil {
		slog.Error("eror connecting to persistent storage", err)
		return nil, err
	}

	ss := &StorageServer{
		Namespace:      GlobalNamespace,
		Config:         cfg,
		Host:           host,
		StorageDecider: d,
		Jsc:            jsc,
		JobsManager:    jobsManager,
		Persistence:    persistence,
		Monitor:        m,
		Peering:        peering,
		Logstream:      logstream,
	}
	ss.createWebServer()

	m.SetNodeStatusOKOnInterval(thisNodePubKey, host, d, cfg.ReportOKIntervalSeconds)

	return ss, nil
}

func (ss *StorageServer) createWebServer() {
	ss.WebServer = echo.New()
	ss.WebServer.HideBanner = true
	ss.WebServer.Debug = true
	ss.WebServer.Use(middleware.CORS())

	ss.WebServer.Use(otelecho.Middleware("storage"))
	telemetry.AddPrometheusMiddlware(ss.WebServer)

	// Register endpoints at /storage
	storage := ss.WebServer.Group("/storage")

	storage.Use(middleware.Logger())
	storage.Use(middleware.Recover())

	// Register endpoints for uploads status table at /storage/uploads
	storage.GET("/uploads", ss.serveStatusUI)
	storage.GET("/uploads/", ss.serveStatusUI)
	storage.GET("/uploads/static/*", ss.serveStatusStaticAssets)
	storage.GET("/uploads/ws", ss.upgradeConnToWebsocket)

	// Register endpoint for React weather map at /storage root
	storage.GET("", ss.serveWeatherMapUI)
	storage.GET("/", ss.serveWeatherMapUI)
	storage.GET("/**", ss.serveWeatherMapUI)
	storage.GET("/assets/*", echo.WrapHandler(http.StripPrefix("/storage/", http.FileServer(getWeatherMapStaticFiles()))))

	// Register API endpoints at /storage/api/v1
	api := storage.Group("/api/v1")
	api.POST("/file", ss.serveFileUpload)
	api.GET("/jobs", ss.serveJobs)
	api.GET("/jobs/:id", ss.serveJobById)
	api.GET("/tmp-obj/:bucket/:key", ss.streamTempObjectByBucketAndKey)
	api.GET("/persistent/shard/:shard", ss.servePersistenceKeysByShard) // QueryParam: includeMD5s=[true|false]
	api.GET("/persistent/file/:fileName", ss.streamPersistenceObjectByFileName)
	api.GET("/stream/:fileName", ss.streamPersistenceObjectByFileName, contentaccess.ContentAccessMiddleware(ss.Peering))
	api.GET("/node-statuses", ss.serveNodeStatuses)
	api.GET("/job-results/:id", ss.serveJobResultsById)

	// TODO: Auth these routes to prevent abuse - they're resource intensive
	api.GET("/logs/statusUpdate", ss.serveStatusUpdateLogs)                 // QueryParams: start (default 1m ago), end, pubKey=string (node's wallet, default="*" for all nodes)
	api.GET("/logs/updateHealthyNodeSet", ss.serveUpdateHealthyNodeSetLogs) // QueryParams: start (default 1m ago), end
	api.GET("/logs/rebalance", ss.serveRebalanceLogs)                       // QueryParams: start (default 1m ago), end, pubKey=string (node's wallet, default="*" for all nodes)
}

/**
 * ROUTE HANDLERS
 **/

func (ss StorageServer) serveStatusUI(c echo.Context) error {
	staticFs := getStatusStaticFiles()
	f, err := staticFs.Open("status.html")
	if err != nil {
		return err
	}
	return c.Stream(200, "text/html", f)
}

func (ss StorageServer) serveStatusStaticAssets(c echo.Context) error {
	staticFs := getStatusStaticFiles()
	assetHandler := http.FileServer(staticFs)
	echo.WrapHandler(http.StripPrefix("storage/storageserver/static/", assetHandler))
	return nil
}

func (ss StorageServer) serveWeatherMapUI(c echo.Context) error {
	weatherMapFs := getWeatherMapStaticFiles()
	f, err := weatherMapFs.Open("index.html")
	if err != nil {
		return err
	}
	return c.Stream(200, "text/html", f)
}

func (ss *StorageServer) serveFileUpload(c echo.Context) error {
	var results []*transcode.Job

	// Multipart form
	form, err := c.MultipartForm()
	if err != nil {
		return err
	}
	template := c.FormValue("template")
	files := form.File["files"]
	defer form.RemoveAll()

	var expectedContentType string
	if template == "audio" {
		expectedContentType = "audio"
	} else {
		expectedContentType = "image"
	}

	for _, file := range files {

		contentType := file.Header.Get("Content-Type")
		if !strings.HasPrefix(contentType, expectedContentType) {
			return echo.NewHTTPError(400, "invalid Content-Type, expected="+expectedContentType)
		}

		job, err := ss.JobsManager.Add(transcode.JobTemplate(template), file)
		if err != nil {
			return err
		}
		results = append(results, job)
	}

	if c.QueryParam("redirect") != "" {
		return c.Redirect(302, c.Request().Referer())
	}

	return c.JSON(200, results)
}

func (ss *StorageServer) serveJobs(c echo.Context) error {
	jobs := ss.JobsManager.List()
	return c.JSON(200, jobs)
}

func (ss StorageServer) serveJobById(c echo.Context) error {
	job := ss.JobsManager.Get(c.Param("id"))
	return c.JSON(200, job)
}

func (ss StorageServer) streamTempObjectByBucketAndKey(c echo.Context) error {
	obj, err := ss.JobsManager.GetObject(c.Param("bucket"), c.Param("key"))
	if err != nil {
		return err
	}
	// TODO: mime type?
	return c.Stream(200, "", obj)
}

func (ss StorageServer) streamPersistenceObjectByFileName(c echo.Context) error {
	reader, err := ss.Persistence.Get(c.Param("fileName"))
	if err != nil {
		return err
	}

	customContext, ok := c.(contentaccess.CustomRequest)
	if ok {
		// If content is gated, set cache-control to no-cache.
		// Otherwise, set the CID cache-control so that client caches the response for 30 days.
		// The contentAccessMiddleware sets the req.ShouldCache object so that we do not
		// have to make another database round trip to get this info.
		if customContext.ShouldCache {
			c.Response().Header().Add("cache-control", "public, max-age=2592000, immutable")
		} else {
			c.Response().Header().Add("cache-control", "no-cache")
		}
	}

	// TODO: mime type?
	return c.Stream(200, "", reader)
}

func (ss *StorageServer) upgradeConnToWebsocket(c echo.Context) error {
	conn, _, _, err := ws.UpgradeHTTP(c.Request(), c.Response())
	if err != nil {
		return err
	}

	ss.JobsManager.RegisterWebsocket(conn)
	return nil
}

func (ss StorageServer) serveNodeStatuses(c echo.Context) error {
	nodeStatuses, err := ss.Monitor.GetNodeStatuses()
	if err != nil {
		return err
	}
	return c.JSON(200, nodeStatuses)
}

func (ss StorageServer) servePersistenceKeysByShard(c echo.Context) error {
	// Make sure shard has namespace prefix
	shard := c.Param("shard")
	if idx := strings.Index(shard, "_"); idx == -1 {
		shard = ss.Namespace + "_" + shard
	}

	includeMD5s := c.QueryParam("includeMD5s")
	if includeMD5s == "true" {
		keysAndMD5s, err := ss.Persistence.GetKeysAndMD5sIn(shard)
		if err != nil {
			return err
		}
		return c.JSON(200, keysAndMD5s)
	} else {
		keys, err := ss.Persistence.GetKeysIn(shard)
		if err != nil {
			return err
		}
		return c.JSON(200, keys)
	}
}

func (ss StorageServer) serveJobResultsById(c echo.Context) error {
	jobID := c.Param("id")
	results, err := ss.Persistence.GetJobResultsFor(jobID)
	if err != nil {
		return err
	}
	return c.JSON(200, results)
}

func (ss StorageServer) serveStatusUpdateLogs(c echo.Context) error {
	start, end, pubKeys, err := ss.parseGetLogsParams(c, false)
	if err != nil {
		return err
	}

	getLogsForPubKey := func(pubKey string) (logs []logstream.NodeStatus) {
		err := ss.Logstream.GetStatusUpdatesInRange(start, end, pubKey, &logs)
		if err != nil {
			slog.Error("Error getting status update logs", err, "pubKey", pubKey)
		}
		return
	}

	return c.JSON(200, getLogsForPubKeys(pubKeys, getLogsForPubKey))
}

func (ss StorageServer) serveRebalanceLogs(c echo.Context) error {
	type StartEventsForHost struct {
		Host   string                        `json:"host"`
		Events []logstream.RebalanceStartLog `json:"events"`
	}
	type EndEventsForHost struct {
		Host   string                      `json:"host"`
		Events []logstream.RebalanceEndLog `json:"events"`
	}
	type RebalanceLogs struct {
		Starts []StartEventsForHost `json:"starts"`
		Ends   []EndEventsForHost   `json:"ends"`
	}

	start, end, pubKeys, err := ss.parseGetLogsParams(c, true)
	if err != nil {
		return err
	}

	getStartLogsForPubKey := func(pubKey string) []StartEventsForHost {
		host, err := getStorageHostFromPubKey(pubKey, ss.Peering)
		if err != nil {
			slog.Error("Error getting rebalanceStart logs", err, "pubKey", pubKey)
			return []StartEventsForHost{}
		}
		var logs []logstream.RebalanceStartLog
		err = ss.Logstream.GetRebalanceStartsInRange(start, end, pubKey, &logs)
		if err != nil {
			return []StartEventsForHost{}
		}
		return []StartEventsForHost{{Host: host, Events: logs}}
	}

	getEndLogsForPubKey := func(pubKey string) []EndEventsForHost {
		host, err := getStorageHostFromPubKey(pubKey, ss.Peering)
		if err != nil {
			slog.Error("Error getting rebalanceEnd logs", err, "pubKey", pubKey)
			return []EndEventsForHost{}
		}
		var logs []logstream.RebalanceEndLog
		err = ss.Logstream.GetRebalanceEndsInRange(start, end, pubKey, &logs)
		if err != nil {
			return []EndEventsForHost{}
		}
		return []EndEventsForHost{{Host: host, Events: logs}}
	}

	startLogs := getLogsForPubKeys(pubKeys, getStartLogsForPubKey)
	endLogs := getLogsForPubKeys(pubKeys, getEndLogsForPubKey)
	return c.JSON(200, RebalanceLogs{Starts: startLogs, Ends: endLogs})
}

func (ss StorageServer) serveUpdateHealthyNodeSetLogs(c echo.Context) error {
	start, end, _, err := ss.parseGetLogsParams(c, false)
	if err != nil {
		return err
	}
	var logs []logstream.UpdateHealthyNodeSetLog
	err = ss.Logstream.GetUpdateHealthyNodeSetsInRange(start, end, &logs)
	if err != nil {
		return err
	}
	return c.JSON(200, logs)
}

// parseGetLogsParams parses the start, end, and pubKey params for the getLogs endpoints and turns "*" or empty pubKey param into a list of all storage nodes if parseWildcardPubKey is true.
func (ss StorageServer) parseGetLogsParams(c echo.Context, parseWildcardPubKey bool) (start time.Time, end time.Time, pubKeys []string, err error) {
	// Parse start and end time range, defaulting to the previous 1 minute
	start = time.Now().UTC().Add(-1 * time.Minute)
	end = time.Now().UTC()
	startStr := c.QueryParam("start")
	endStr := c.QueryParam("end")
	if startStr != "" {
		start, err = time.Parse(time.RFC3339, startStr)
		if err != nil {
			err = c.String(http.StatusBadRequest, "start must be a valid RFC3339 timestamp")
			return
		}
	}
	if endStr != "" {
		end, err = time.Parse(time.RFC3339, endStr)
		if err != nil {
			err = c.String(http.StatusBadRequest, "end must be a valid RFC3339 timestamp")
			return
		}
	}

	// Parse pubKey param for wallet address to query logs for
	pubKeyParam := strings.ToLower(c.QueryParam("pubKey"))
	if pubKeyParam == "" {
		if parseWildcardPubKey {
			var storageNodes []sharedConfig.ServiceNode
			storageNodes, err = ss.Peering.GetContentNodes()
			if err != nil {
				return
			}
			for _, node := range storageNodes {
				pubKeys = append(pubKeys, strings.ToLower(node.DelegateOwnerWallet))
			}
		} else {
			pubKeys = []string{"*"}
		}
	} else if strings.Contains(pubKeyParam, ",") {
		pubKeys = strings.Split(pubKeyParam, ",")
	} else {
		pubKeys = []string{pubKeyParam}
	}
	return
}

// getLogsForPubKeys gets logs for each pubKey in pubKeys in a separate goroutine and returns the logs from all goroutines.
func getLogsForPubKeys[T any](pubKeys []string, getLogsForPubKey func(pubKey string) []T) []T {
	logsChan := make(chan []T)

	for _, pubKey := range pubKeys {
		go func(key string) {
			logsChan <- getLogsForPubKey(key)
		}(pubKey)
	}

	// Collect results from all goroutines
	logs := make([]T, 0, len(pubKeys))
	for i := 0; i < len(pubKeys); i++ {
		logsForPubKey := <-logsChan
		logs = append(logs, logsForPubKey...)
	}
	close(logsChan)
	return logs
}

//go:embed static
var embeddedStatusFiles embed.FS

func getStatusStaticFiles() http.FileSystem {
	fsys, err := fs.Sub(embeddedStatusFiles, "static")
	if err != nil {
		panic(err)
	}

	return http.FS(fsys)
}

//go:embed weather-map/dist
var embeddedWeatherMapFiles embed.FS

func getWeatherMapStaticFiles() http.FileSystem {
	fsys, err := fs.Sub(embeddedWeatherMapFiles, "weather-map/dist")
	if err != nil {
		panic(err)
	}

	return http.FS(fsys)
}

func getStorageHostFromPubKey(pubKey string, peering peering.Peering) (string, error) {
	nodes, err := peering.GetContentNodes()
	if err != nil {
		return "", err
	}
	for _, node := range nodes {
		if strings.EqualFold(node.DelegateOwnerWallet, pubKey) {
			return strings.ToLower(node.Endpoint), err
		}
	}
	return "", errors.New("no node found with pubKey " + pubKey)
}
