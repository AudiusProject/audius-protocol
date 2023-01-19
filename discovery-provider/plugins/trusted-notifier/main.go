package main

import (
	"fmt"
	"net/http"
	"github.com/labstack/echo/v4"

	"trusted-notifier.audius.co/config"
)

func main() {
	// init config
	c := config.New().Expect("Creating config failed")
	fmt.Println(c)

	// dial datasources in parallel

	// run migrations

	// ProcessTracksDiffQueue start

	// Verify delist queue start

	e := echo.New()
	e.GET("/", func(c echo.Context) error {
		// TODO remove this
		return c.String(http.StatusOK, "Hello, World!")
	})
	e.GET("/mail_in", func(c echo.Context) error {
		// TODO implement
		return c.String(http.StatusOK, "MAIL IN")
	})
	e.GET("/health_check", func(c echo.Context) error {
		// TODO implement
		return c.String(http.StatusOK, "healthy")
	})
	e.GET("/process_check", func(c echo.Context) error {
		// TODO implement
		return c.String(http.StatusOK, "process-y")
	})
	e.GET("/available", func(c echo.Context) error {
		// TODO implement
		return c.String(http.StatusOK, "available")
	})
	e.Logger.Fatal(e.Start(":1323"))	
}