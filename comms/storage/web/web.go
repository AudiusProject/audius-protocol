// Package web handles webserver endpoints for interacting with the storage node.
package web

import (
	"embed"
	"io/fs"
	"net/http"
	"os"

	"comms.audius.co/discovery/config"
	"comms.audius.co/storage/glue"
	"comms.audius.co/storage/transcode"
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
	makeTranscodeDemoRoutes(storage, g)

	weatherMap := e.Group("/weather-map")
	makeWeatherMapRoutes(weatherMap)

	return e
}

// makeStorageRoutes creates all /storage using echo group storage glue g.
func makeStorageRoutes(storage *echo.Group, g *glue.Glue) {
	// jobman, err := transcode.NewJobsManager(g.Jsc, "austin1", 1)
	// if err != nil {
	// 	panic("err")
	// }
	// jobman.StartWorkers(3)

	// storage.POST("/file", uploadFile(jobman))
	// TODO: Migrate other functions from makeTranscodeDemoRoutes to here.
}

// makeWeatherMapRoutes redirects all /weather-map routes to static assets using echo group weatherMap.
func makeWeatherMapRoutes(weatherMap *echo.Group) {
	// TODO
}

func uploadFile(jobman *transcode.JobsManager) func(c echo.Context) error {
	return func(c echo.Context) error {
		var results []*transcode.Job

		// Multipart form
		form, err := c.MultipartForm()
		if err != nil {
			return err
		}
		files := form.File["files"]
		defer form.RemoveAll()

		for _, file := range files {
			job, err := jobman.Add("audio", file)
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
}

// makeTranscodeDemoRoutes creates all /storage routes from the transcode demo.
// TODO: Migrate these to makeStorageRoutes above to consolidate with a pattern that allows for easier testing.
func makeTranscodeDemoRoutes(storage *echo.Group, g *glue.Glue) {
	jobman, err := transcode.NewJobsManager(g.Jsc, "austin1", 1)
	if err != nil {
		panic(err)
	}

	jobman.StartWorkers(3)

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

	storage.POST("/file", func(c echo.Context) error {

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
			job, err := jobman.Add(template, file)
			if err != nil {
				return err
			}
			results = append(results, job)
		}

		if c.QueryParam("redirect") != "" {
			return c.Redirect(302, c.Request().Referer())
		}

		return c.JSON(200, results)

	})

	storage.GET("/jobs", func(c echo.Context) error {
		jobs := jobman.List()
		return c.JSON(200, jobs)
	})

	storage.GET("/jobs/:id", func(c echo.Context) error {
		job := jobman.Get(c.Param("id"))
		return c.JSON(200, job)
	})

	storage.GET("/obj/:bucket/:key", func(c echo.Context) error {
		obj, err := jobman.GetObject(c.Param("bucket"), c.Param("key"))
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

		jobman.RegisterWebsocket(conn)
		return nil
	})
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
