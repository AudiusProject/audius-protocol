package server

import (
	"github.com/labstack/echo/v4"
)

type Metrics struct {
	Host                   string         `json:"host"`
	Uploads                int64          `json:"uploads"`
	OutboxSizes            map[string]int `json:"outbox_sizes"`
	AttemptedLegacyServes  []string       `json:"attempted_legacy_serves"`
	SuccessfulLegacyServes []string       `json:"successful_legacy_serves"`
}

func (ss *MediorumServer) getMetrics(c echo.Context) error {
	m := Metrics{}
	m.Host = ss.Config.Self.Host
	m.Uploads = ss.uploadsCount
	m.OutboxSizes = ss.crud.GetOutboxSizes()

	ss.legacyServesMu.RLock()
	defer ss.legacyServesMu.RUnlock()
	m.AttemptedLegacyServes = ss.attemptedLegacyServes
	m.SuccessfulLegacyServes = ss.successfulLegacyServes

	return c.JSON(200, m)
}
