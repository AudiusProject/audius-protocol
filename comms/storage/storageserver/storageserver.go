// Package storageserver lives for the lifetime of the program and mananges connections and route handlers.
package storageserver

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"os"

	"comms.audius.co/discovery/config"
	"comms.audius.co/storage/decider"
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
	jobsManager, err := transcode.NewJobsManager(jsc, GlobalNamespace, 1)
	if err != nil {
		panic(err)
	}
	jobsManager.StartWorkers(NumJobWorkers)

	return NewCustom(GlobalNamespace, d, jsc, jobsManager)
}

func NewCustom(namespace string, d decider.StorageDecider, jsc nats.JetStreamContext, jobsManager *transcode.JobsManager) *StorageServer {
	ss := &StorageServer{Namespace: namespace, StorageDecider: d, Jsc: jsc, JobsManager: jobsManager}
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
	storage.GET("/obj/:bucket/:key", ss.streamObjectByBucketAndKey)
	storage.GET("/ws", ss.upgradeConnToWebsocket)

	// TODO: Embed static /weather-map files in binary and server from the route below.
	// weatherMap := ss.WebServer.Group("/weather-map")

	ss.runStorer("KV_" + namespace + transcode.KvSuffix)

	return ss
}

// runStorer runs a goroutine to pull tracks from temp NATS object storage to long-term object storage.
func (ss *StorageServer) runStorer(uploadStream string) {
	thisNodePubKey := os.Getenv("audius_delegate_owner_wallet") // TODO: Get from config or something - same for value in NewProd() above
	// Create a per-node explicit pull consumer on the stream that backs the track upload status KV bucket
	storerDurable := fmt.Sprintf("STORER_%s", thisNodePubKey)
	_, err := ss.Jsc.AddConsumer(uploadStream, &nats.ConsumerConfig{
		Durable:       storerDurable,
		AckPolicy:     nats.AckExplicitPolicy,
		DeliverPolicy: nats.DeliverAllPolicy, // Using the "all" policy means when a node registers it will download every track that it needs
		ReplayPolicy:  nats.ReplayInstantPolicy,
	})
	if err != nil {
		panic(err)
	}

	// Create a subscription on the consumer for every node
	// Subject can be empty since it defaults to all subjects bound to the stream
	storerSub, err := ss.Jsc.PullSubscribe("", storerDurable, nats.BindStream(uploadStream))
	if err != nil {
		panic(err)
	}

	// Watch KV store to download files to long-term storage
	// TODO: Maybe there should be an exit channel for in case we restart StorageServer without restarting the whole program? (e.g., if we want to update StorageDecider to pass it a new slice of storage node pubkeys)
	go func() {
		for {
			msgs, err := storerSub.Fetch(1)
			if err == nil {
				msgs[0].Ack()

				job := transcode.Job{}
				err := json.Unmarshal(msgs[0].Data, &job)
				if err != nil {
					panic(err)
				}

				if job.Status == transcode.JobStatusDone {
					if ss.StorageDecider.ShouldStore(job.ID) {
						fmt.Printf("Storing file with ID %q\n", job.ID)
						// TODO: Use CDK to download to long-term storage
					} else {
						fmt.Printf("Not storing file with ID %q\n", job.ID)
						continue
					}
				}
			} else if err != nats.ErrTimeout { // Timeout is expected when there's nothing new in the stream
				fmt.Printf("Error fetching message to store a file: %q\n", err)
			}
		}
	}()
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

func (ss *StorageServer) streamObjectByBucketAndKey(c echo.Context) error {
	obj, err := ss.JobsManager.GetObject(c.Param("bucket"), c.Param("key"))
	if err != nil {
		return err
	}
	// TODO: mime type?
	return c.Stream(200, "", obj)
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
