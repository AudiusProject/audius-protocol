// Package storageserver lives for the lifetime of the program and mananges connections and route handlers.
package storageserver

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"strings"

	"comms.audius.co/shared/peering"
	"comms.audius.co/storage/config"
	"comms.audius.co/storage/contentaccess"
	"comms.audius.co/storage/decider"
	"comms.audius.co/storage/monitor"
	"comms.audius.co/storage/persistence"
	"comms.audius.co/storage/telemetry"
	"comms.audius.co/storage/transcode"
	"github.com/gobwas/ws"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/nats-io/nats.go"
	"go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho"
)

const (
	GlobalNamespace   string = "0"
	ReplicationFactor int    = 3
	NumJobWorkers     int    = 3
)

// StorageServer lives for the lifetime of the program and holds connections and managers.
type StorageServer struct {
	Namespace      string
	StorageDecider decider.StorageDecider
	Jsc            nats.JetStreamContext
	JobsManager    *transcode.JobsManager
	Persistence    *persistence.Persistence
	WebServer      *echo.Echo
	Monitor        *monitor.Monitor
	Peering        *peering.Peering
}

func NewProd(config *config.StorageConfig, jsc nats.JetStreamContext, peering *peering.Peering) *StorageServer {
	allContentNodes, err := peering.GetContentNodes()
	if err != nil {
		log.Fatal("Error getting content nodes: ", err)
	}
	thisNodePubKey := strings.ToLower(config.PeeringConfig.Keys.DelegatePublicKey)
	var host string
	var allStorageNodePubKeys []string
	for _, node := range allContentNodes {
		allStorageNodePubKeys = append(allStorageNodePubKeys, strings.ToLower(node.DelegateOwnerWallet))
		if strings.EqualFold(node.DelegateOwnerWallet, thisNodePubKey) {
			host = node.Endpoint
		}
	}
	if host == "" {
		log.Fatal("Could not find host for this node. If running locally, check AUDIUS_DEV_ONLY_REGISTERED_NODES")
	}

	d := decider.NewRendezvousDecider(GlobalNamespace, ReplicationFactor, thisNodePubKey, allStorageNodePubKeys, jsc)

	jobsManager, err := transcode.NewJobsManager(jsc, GlobalNamespace, 1)
	if err != nil {
		log.Fatal("failed to start jobs manager: ", err)
	}
	jobsManager.StartWorkers(NumJobWorkers)

	m := monitor.New(jsc)
	err = m.SetHostAndShardsForNode(thisNodePubKey, host, d.ShardsStored)
	if err != nil {
		log.Fatalf("Error setting host and shards for node: %v", err)
	}

	persistence, err := persistence.New(thisNodePubKey, "KV_"+GlobalNamespace+transcode.KvSuffix, config.StorageDriverUrl, d, jsc)
	if err != nil {
		log.Fatal("[!!!] Error connecting to persistent storage: ", err)
	}

	return NewCustom(
		GlobalNamespace,
		d,
		jsc,
		jobsManager,
		persistence,
		m,
	)
}

func NewCustom(namespace string, d decider.StorageDecider, jsc nats.JetStreamContext, jobsManager *transcode.JobsManager, persistence *persistence.Persistence, m *monitor.Monitor) *StorageServer {
	ss := &StorageServer{
		Namespace:      namespace,
		StorageDecider: d,
		Jsc:            jsc,
		JobsManager:    jobsManager,
		Persistence:    persistence,
		Monitor:        m,
	}
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

	storage.GET("", ss.serveStatusUI)
	storage.GET("/", ss.serveStatusUI)
	storage.GET("/static/*", ss.serveStatusStaticAssets)
	storage.POST("/file", ss.serveFileUpload)
	storage.GET("/jobs", ss.serveJobs)
	storage.GET("/jobs/:id", ss.serveJobById)
	storage.GET("/tmp-obj/:bucket/:key", ss.streamTempObjectByBucketAndKey)
	storage.GET("/persistent/shard/:shard", ss.servePersistenceKeysByShard) // QueryParam: includeMD5s=[true|false]
	storage.GET("/persistent/file/:fileName", ss.streamPersistenceObjectByFileName, contentaccess.ContentAccessMiddleware(ss.Peering))
	storage.GET("/ws", ss.upgradeConnToWebsocket)
	storage.GET("/nodes-to-shards", ss.serveNodesToShards)
	storage.GET("/job-results/:id", ss.serveJobResultsById)

	// Register endpoints at /storage/weather for React weather map
	weatherMap := storage.Group("/weather")
	weatherMap.GET("", ss.serveWeatherMapUI)
	weatherMap.GET("/**", ss.serveWeatherMapUI)
	weatherMap.GET("/assets/*", echo.WrapHandler(http.StripPrefix("/storage/weather/", http.FileServer(getWeatherMapStaticFiles()))))

	return ss
}

/**
 * ROUTE HANDLERS
 **/

func (ss *StorageServer) serveStatusUI(c echo.Context) error {
	staticFs := getStatusStaticFiles()
	f, err := staticFs.Open("status.html")
	if err != nil {
		return err
	}
	return c.Stream(200, "text/html", f)
}

func (ss *StorageServer) serveStatusStaticAssets(c echo.Context) error {
	staticFs := getStatusStaticFiles()
	assetHandler := http.FileServer(staticFs)
	echo.WrapHandler(http.StripPrefix("storage/storageserver/static/", assetHandler))
	return nil
}

func (ss *StorageServer) serveWeatherMapUI(c echo.Context) error {
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

func (ss *StorageServer) serveJobById(c echo.Context) error {
	job := ss.JobsManager.Get(c.Param("id"))
	return c.JSON(200, job)
}

func (ss *StorageServer) streamTempObjectByBucketAndKey(c echo.Context) error {
	obj, err := ss.JobsManager.GetObject(c.Param("bucket"), c.Param("key"))
	if err != nil {
		return err
	}
	// TODO: mime type?
	return c.Stream(200, "", obj)
}

func (ss *StorageServer) streamPersistenceObjectByFileName(c echo.Context) error {
	reader, err := ss.Persistence.Get(c.Param("fileName"))
	if err != nil {
		return err
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

func (ss *StorageServer) serveNodesToShards(c echo.Context) error {
	nodesToShards, err := ss.Monitor.GetNodesToShards()
	if err != nil {
		return err
	}
	return c.JSON(200, nodesToShards)
}

func (ss *StorageServer) servePersistenceKeysByShard(c echo.Context) error {
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

func (ss *StorageServer) serveJobResultsById(c echo.Context) error {
	jobID := c.Param("id")
	results, err := ss.Persistence.GetJobResultsFor(jobID)
	if err != nil {
		return err
	}
	return c.JSON(200, results)
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
