package server

import (
	"github.com/labstack/echo/v4"
)

type Metrics struct {
	Host         string         `json:"host"`
	Uploads      int64          `json:"uploads"`
	ProblemBlobs int64          `json:"problem_blobs"`
	OutboxSizes  map[string]int `json:"outbox_sizes"`
}

func (ss *MediorumServer) getMetrics(c echo.Context) error {
	m := Metrics{}
	m.Host = ss.Config.Self.Host

	count, err := ss.findProblemBlobsCount(false)
	if err != nil {
		return err
	}
	m.ProblemBlobs = count
	var ucount int64
	uploads := []*Upload{}
	ss.crud.DB.Order("created_at desc").Find(&uploads).Count(&ucount)
	m.Uploads = ucount

	m.OutboxSizes = ss.crud.GetOutboxSizes()

	return c.JSON(200, m)
}
