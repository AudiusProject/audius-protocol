package server

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/labstack/echo/v4"
)

type Metrics struct {
	Host              string         `json:"host"`
	Uploads           int64          `json:"uploads"`
	OutboxSizes       map[string]int `json:"outbox_sizes"`
	RedirectCacheSize int            `json:"redirect_cache_size"`
}

func (ss *MediorumServer) getMetrics(c echo.Context) error {
	m := Metrics{}
	m.Host = ss.Config.Self.Host
	m.Uploads = ss.uploadsCount
	m.OutboxSizes = ss.crud.GetOutboxSizes()
	m.RedirectCacheSize = ss.redirectCache.Len()

	return c.JSON(200, m)
}

func (ss *MediorumServer) getLogfile(c echo.Context, fileName string) error {
	file := fmt.Sprintf("/tmp/mediorum/%s", fileName)

	data, err := os.ReadFile(file)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"err": fmt.Sprintf("%s not found.", fileName)})
	}

	return c.JSON(200, strings.Split(string(data), "\n"))
}

func (ss *MediorumServer) getPartitionOpsLog(c echo.Context) error {
	return ss.getLogfile(c, "partition_ops.txt")
}

func (ss *MediorumServer) getReaperLog(c echo.Context) error {
	return ss.getLogfile(c, "reaper.txt")
}
