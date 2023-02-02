// Package storageserver lives for the lifetime of the program and mananges connections and route handlers.
package storageserver

import (
	"embed"
	"io/fs"
	"net/http"
	"os"

	"comms.audius.co/discovery/config"
	"comms.audius.co/storage/decider"
	"comms.audius.co/storage/longterm"
	"comms.audius.co/storage/transcode"
	"github.com/gobwas/ws"
	"github.com/labstack/echo/v4"
	"github.com/nats-io/nats.go"
)

const (
	GlobalNamespace   string = "0"
	ReplicationFactor int    = 3
	NumJobWorkers     int    = 3
)

// TODO: Not clear how we'll use the commented out code below yet. Maybe remove

// type NodeStatus string

// const (
// 	NodeStatusOk           NodeStatus = "ok"
// 	NodeStatusDraining     NodeStatus = "draining"
// 	NodeStatusDeregistered NodeStatus = "deregistered"
// )

// type Node struct {
// 	Status string `json:"status"`
// }

// StorageServer lives for the lifetime of the program and holds connections and managers.
type StorageServer struct {
	Namespace      string
	StorageDecider decider.StorageDecider
	Jsc            nats.JetStreamContext
	JobsManager    *transcode.JobsManager
	LongTerm       *longterm.LongTerm
	WebServer      *echo.Echo
}

func NewProd(jsc nats.JetStreamContext) *StorageServer {
	// TODO: config refactor
	allStorageNodePubKeys := []string{
		"0x1c185053c2259f72fd023ED89B9b3EBbD841DA0F",
		"0x90b8d2655A7C268d0fA31758A714e583AE54489D",
		"0xb7b9599EeB2FD9237C94cFf02d74368Bb2df959B",
		"0xfa4f42633Cb0c72Aa35D3D1A3566abb7142c7b16",
	} // TODO: get dynamically (from KV store?) and re-initialize on change
	thisNodePubKey := os.Getenv("audius_delegate_owner_wallet") // TODO: get dynamically
	d := decider.NewRendezvousDecider(GlobalNamespace, ReplicationFactor, allStorageNodePubKeys, thisNodePubKey, jsc)
	jobsManager, err := transcode.NewJobsManager(jsc, GlobalNamespace, d, 1)
	if err != nil {
		panic(err)
	}
	jobsManager.StartWorkers(NumJobWorkers)

	return NewCustom(GlobalNamespace, d, jsc, jobsManager, longterm.New("KV_"+GlobalNamespace+transcode.KvSuffix, d, jsc))
}

func NewCustom(namespace string, d decider.StorageDecider, jsc nats.JetStreamContext, jobsManager *transcode.JobsManager, longTerm *longterm.LongTerm) *StorageServer {
	ss := &StorageServer{
		Namespace:      namespace,
		StorageDecider: d,
		Jsc:            jsc,
		JobsManager:    jobsManager,
		LongTerm:       longTerm,
	}
	ss.WebServer = echo.New()
	ss.WebServer.HideBanner = true
	ss.WebServer.Debug = true

	// Register endpoints at /storage
	storage := ss.WebServer.Group("/storage")
	storage.GET("", ss.serveStatusUI)
	storage.GET("/", ss.serveStatusUI)
	storage.GET("/static/*", ss.serveStaticAssets)
	storage.POST("/file", ss.serveFileUpload)
	storage.GET("/jobs", ss.serveJobs)
	storage.GET("/jobs/:id", ss.serveJobById)
	storage.GET("/tmp-obj/:bucket/:key", ss.streamTempObjectByBucketAndKey)
	storage.GET("/long-term/:key", ss.streamLongTermObjectByKey)
	storage.GET("/ws", ss.upgradeConnToWebsocket)

	// TODO: Embed static /weather-map files in binary and server from the route below.
	// weatherMap := ss.WebServer.Group("/weather-map")

	return ss
}

/**
 * ROUTE HANDLERS
 **/

func (ss *StorageServer) serveStatusUI(c echo.Context) error {
	staticFs := getStaticFiles()
	f, err := staticFs.Open("status.html")
	if err != nil {
		return err
	}
	return c.Stream(200, "text/html", f)
}

func (ss *StorageServer) serveStaticAssets(c echo.Context) error {
	staticFs := getStaticFiles()
	assetHandler := http.FileServer(staticFs)
	echo.WrapHandler(http.StripPrefix("storage/storageserver/static/", assetHandler))
	return nil
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

func (ss *StorageServer) streamLongTermObjectByKey(c echo.Context) error {
	reader, err := ss.LongTerm.Get(c.Param("key"))
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

//go:embed static
var embededFiles embed.FS

func getStaticFiles() http.FileSystem {
	devMode := config.Env == "standalone"
	if devMode {
		return http.FS(os.DirFS("storage/storageserver/static"))
	}

	fsys, err := fs.Sub(embededFiles, "static")
	if err != nil {
		panic(err)
	}

	return http.FS(fsys)
}
