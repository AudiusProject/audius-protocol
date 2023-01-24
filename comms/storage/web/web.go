// Package web handles webserver endpoints for interacting with the storage node.
package web

import (
	"comms.audius.co/storage/glue"
	"comms.audius.co/storage/transcode"
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
	// jobman, err := transcode.NewJobsManager(g.Jsc, "austin1", 1)
	// if err != nil {
	// 	panic("err")
	// }
	// jobman.StartWorkers(3)

	// storage.POST("/file", uploadFile(jobman))
	// TODO storage.Get("/...", ...)
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
	}
}
