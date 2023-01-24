package storage

import (
	"embed"
	"io/fs"
	"net/http"
	"os"

	"comms.audius.co/discovery/config"
	"comms.audius.co/storage/transcode"
	"github.com/gobwas/ws"
	"github.com/labstack/echo/v4"
	"github.com/nats-io/nats.go"
)

func startStorageServer(jsc nats.JetStreamContext, e *echo.Echo) {

	jobman, err := transcode.NewJobsManager(jsc, "austin1", 1)
	if err != nil {
		panic("err")
	}

	jobman.StartWorkers(3)

	// start server
	// Echo instance
	// e := echo.New()

	// Routes
	// e.Static("/", "public")

	g := e.Group("/storage")

	staticFs := getFileSystem()
	assetHandler := http.FileServer(staticFs)
	g.GET("/static/*", echo.WrapHandler(http.StripPrefix("/storage/static/", assetHandler)))

	serveStatusUI := func(c echo.Context) error {
		f, err := staticFs.Open("status.html")
		if err != nil {
			return err
		}
		return c.Stream(200, "text/html", f)
	}
	g.GET("", serveStatusUI)
	g.GET("/", serveStatusUI)

	g.POST("/file", func(c echo.Context) error {

		var results []*transcode.Job

		// Multipart form
		form, err := c.MultipartForm()
		if err != nil {
			return err
		}
		files := form.File["files"]
		defer form.RemoveAll()

		for _, file := range files {
			// Source
			src, err := file.Open()
			if err != nil {
				return err
			}

			// add to jobman
			job, err := jobman.Add(src)
			if err != nil {
				return err
			}

			src.Close()
			results = append(results, job)

		}

		if c.QueryParam("redirect") != "" {
			return c.Redirect(302, c.Request().Referer())
		}

		return c.JSON(200, results)

	})

	g.GET("/jobs", func(c echo.Context) error {
		jobs := jobman.List()
		return c.JSON(200, jobs)
	})

	g.GET("/jobs/:id", func(c echo.Context) error {
		job := jobman.Get(c.Param("id"))
		return c.JSON(200, job)
	})

	g.GET("/obj/:bucket/:key", func(c echo.Context) error {
		obj, err := jobman.GetObject(c.Param("bucket"), c.Param("key"))
		if err != nil {
			return err
		}
		// todo: mime type?
		return c.Stream(200, "", obj)
	})

	g.GET("/ws", func(c echo.Context) error {
		w := c.Response()
		r := c.Request()

		conn, _, _, err := ws.UpgradeHTTP(r, w)
		if err != nil {
			return err
		}

		jobman.RegisterWebsocket(conn)
		return nil
	})

}

//go:embed static
var embededFiles embed.FS

func getFileSystem() http.FileSystem {
	devMode := config.Env == "standalone"
	if devMode {
		return http.FS(os.DirFS("storage/static"))
	}

	fsys, err := fs.Sub(embededFiles, "static")
	if err != nil {
		panic(err)
	}

	return http.FS(fsys)
}
