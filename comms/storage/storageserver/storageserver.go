// Package storageserver lives for the lifetime of the program and mananges connections and route handlers.
package storageserver

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"

	discoveryConfig "comms.audius.co/discovery/config"
	"comms.audius.co/storage/config"
	"comms.audius.co/storage/decider"
	"comms.audius.co/storage/longterm"
	"comms.audius.co/storage/monitor"
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
	LongTerm       *longterm.LongTerm
	WebServer      *echo.Echo
	Monitor        *monitor.Monitor
}

func NewProd(config *config.StorageConfig, jsc nats.JetStreamContext) *StorageServer {
	thisNodePubKey := config.DelegatePublicKey.Hex
	var host string
	// TODO: host config
	switch thisNodePubKey {
	case "0x1c185053c2259f72fd023ED89B9b3EBbD841DA0F":
		host = "http://localhost:8924"
	case "0x90b8d2655A7C268d0fA31758A714e583AE54489D":
		host = "http://localhost:8925"
	case "0xb7b9599EeB2FD9237C94cFf02d74368Bb2df959B":
		host = "http://localhost:8926"
	case "0xfa4f42633Cb0c72Aa35D3D1A3566abb7142c7b16":
		host = "http://localhost:8927"
	}

	d := decider.NewRendezvousDecider(GlobalNamespace, ReplicationFactor, thisNodePubKey, jsc)
	if host == "" {
		host = os.Getenv("creatorNodeEndpoint") // stage + prod
	}

	jobsManager, err := transcode.NewJobsManager(jsc, GlobalNamespace, 1)
	if err != nil {
		panic(err)
	}
	jobsManager.StartWorkers(NumJobWorkers)

	m := monitor.New(jsc)
	err = m.SetHostAndShardsForNode(thisNodePubKey, host, d.ShardsStored)
	if err != nil {
		log.Fatal("Error setting host and shards for node", "err", err)
	}

	return NewCustom(
		GlobalNamespace,
		d,
		jsc,
		jobsManager,
		longterm.New(thisNodePubKey, "KV_"+GlobalNamespace+transcode.KvSuffix, d, jsc),
		m,
	)
}

func NewCustom(namespace string, d decider.StorageDecider, jsc nats.JetStreamContext, jobsManager *transcode.JobsManager, longTerm *longterm.LongTerm, m *monitor.Monitor) *StorageServer {
	ss := &StorageServer{
		Namespace:      namespace,
		StorageDecider: d,
		Jsc:            jsc,
		JobsManager:    jobsManager,
		LongTerm:       longTerm,
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
	storage.GET("/long-term/shard/:shard", ss.serveLongTermKeysByShard) // QueryParam: includeMD5s=[true|false]
	storage.GET("/long-term/file/:fileName", ss.streamLongTermObjectByFileName)
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

	for _, file := range files {
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

func (ss *StorageServer) streamLongTermObjectByFileName(c echo.Context) error {
	reader, err := ss.LongTerm.Get(c.Param("fileName"))
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

func (ss *StorageServer) serveLongTermKeysByShard(c echo.Context) error {
	// Make sure shard has namespace prefix
	shard := c.Param("shard")
	if idx := strings.Index(shard, "_"); idx == -1 {
		shard = ss.Namespace + "_" + shard
	}

	includeMD5s := c.QueryParam("includeMD5s")
	if includeMD5s == "true" {
		keysAndMD5s, err := ss.LongTerm.GetKeysAndMD5sIn(shard)
		if err != nil {
			return err
		}
		return c.JSON(200, keysAndMD5s)
	} else {
		keys, err := ss.LongTerm.GetKeysIn(shard)
		if err != nil {
			return err
		}
		return c.JSON(200, keys)
	}
}

func (ss *StorageServer) serveJobResultsById(c echo.Context) error {
	jobID := c.Param("id")
	results, err := ss.LongTerm.GetJobResultsFor(jobID)
	if err != nil {
		return err
	}
	return c.JSON(200, results)
}

//go:embed static
var embeddedStatusFiles embed.FS

func getStatusStaticFiles() http.FileSystem {
	devMode := discoveryConfig.Env == "standalone"
	if devMode {
		return http.FS(os.DirFS("storage/storageserver/static"))
	}

	fsys, err := fs.Sub(embeddedStatusFiles, "static")
	if err != nil {
		panic(err)
	}

	return http.FS(fsys)
}

//go:embed weather-map/dist
var embeddedWeatherMapFiles embed.FS

func getWeatherMapStaticFiles() http.FileSystem {
	// devMode := config.Env == "standalone"
	// if devMode {
	// 	return http.FS(os.DirFS("storage/storageserver/weather-map/dist"))
	// }

	fsys, err := fs.Sub(embeddedWeatherMapFiles, "weather-map/dist")
	if err != nil {
		panic(err)
	}

	return http.FS(fsys)
}
