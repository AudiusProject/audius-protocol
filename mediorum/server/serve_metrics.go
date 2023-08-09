package server

import (
	"github.com/labstack/echo/v4"
)

type Metrics struct {
	Host        string         `json:"host"`
	Uploads     int64          `json:"uploads"`
	OutboxSizes map[string]int `json:"outbox_sizes"`
}

func (ss *MediorumServer) getMetrics(c echo.Context) error {
	m := Metrics{}
	m.Host = ss.Config.Self.Host
	m.Uploads = ss.uploadsCount
	m.OutboxSizes = ss.crud.GetOutboxSizes()

	return c.JSON(200, m)
}
