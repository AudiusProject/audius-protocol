// Package web handles webserver endpoints for interacting with the storage node.
package web

import (
	"embed"
	"io/fs"
	"net/http"
	"os"

	"comms.audius.co/discovery/config"
	"comms.audius.co/storage/glue"
	"comms.audius.co/storage/jobs"
	"comms.audius.co/storage/jobs/jobsmonitor"
	"github.com/gobwas/ws"
	"github.com/labstack/echo/v4"
)

// NewServer creates a new echo server with glue.
func NewServer(g *glue.Glue) *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.Debug = true

	storage := e.Group("/storage")
	makeStorageRoutes(storage, g)

	weatherMap := e.Group("/weather-map")
	makeWeatherMapRoutes(weatherMap)

	return e
}

// makeStorageRoutes creates all /storage using echo group storage glue g.
func makeStorageRoutes(storage *echo.Group, g *glue.Glue) {
	// Serve static files to show transcode demo table
	staticFs := getTranscodeDemoStaticFiles()
	assetHandler := http.FileServer(staticFs)
	storage.GET("/static/*", echo.WrapHandler(http.StripPrefix("storage/web/static/", assetHandler)))
	serveStatusUI := func(c echo.Context) error {
		f, err := staticFs.Open("status.html")
		if err != nil {
			return err
		}
		return c.Stream(200, "text/html", f)
	}
	storage.GET("", serveStatusUI)
	storage.GET("/", serveStatusUI)

	storage.POST("/file", uploadFile(g))
	makeJobMonitorRoutes(storage, g.JobsManager.GetMonitor())
}

// makeJobMonitorRoutes creates /storage routes for monitoring the progress of jobs.
func makeJobMonitorRoutes(storage *echo.Group, jobsMonitor jobsmonitor.JobsMonitor) {
	storage.GET("/jobs", func(c echo.Context) error {
		jobs := jobsMonitor.List()
		return c.JSON(200, jobs)
	})

	storage.GET("/jobs/:id", func(c echo.Context) error {
		job := jobsMonitor.GetJob(c.Param("id"))
		return c.JSON(200, job)
	})

	storage.GET("/obj/:bucket/:key", func(c echo.Context) error {
		obj, err := jobsMonitor.GetObject(c.Param("bucket"), c.Param("key"))
		if err != nil {
			return err
		}
		// todo: mime type?
		return c.Stream(200, "", obj)
	})

	storage.GET("/ws", func(c echo.Context) error {
		w := c.Response()
		r := c.Request()

		conn, _, _, err := ws.UpgradeHTTP(r, w)
		if err != nil {
			return err
		}

		jobsMonitor.RegisterWebsocket(conn)
		return nil
	})
}

// makeWeatherMapRoutes redirects all /weather-map routes to static assets using echo group weatherMap.
func makeWeatherMapRoutes(weatherMap *echo.Group) {
	// TODO
}

func uploadFile(g *glue.Glue) func(c echo.Context) error {
	return func(c echo.Context) error {
		var results []jobs.Job

		// Multipart form
		form, err := c.MultipartForm()
		if err != nil {
			return err
		}
		fileHeaders := form.File["files"]
		defer form.RemoveAll()

		for _, fileHeader := range fileHeaders {
			// Source
			src, err := fileHeader.Open()
			if err != nil {
				return err
			}

			// Create job and queue it for transcoding by saving it to KV store
			transcodeJob, err := jobs.NewTranscodeJob(src, g.JobsManager.GetTempObjStore())
			if err != nil {
				return err
			}
			err = g.JobsManager.SaveJob(transcodeJob)
			if err != nil {
				return err
			}

			src.Close()
			results = append(results, transcodeJob)

		}

		if c.QueryParam("redirect") != "" {
			return c.Redirect(302, c.Request().Referer())
		}

		return c.JSON(200, results)
	}
}

//go:embed static
var embededFiles embed.FS

func getTranscodeDemoStaticFiles() http.FileSystem {
	devMode := config.Env == "standalone"
	if devMode {
		return http.FS(os.DirFS("storage/web/static"))
	}

	fsys, err := fs.Sub(embededFiles, "static")
	if err != nil {
		panic(err)
	}

	return http.FS(fsys)
}
