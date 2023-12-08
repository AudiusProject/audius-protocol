package server

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"golang.org/x/exp/slices"
)

type Metrics struct {
	Host              string         `json:"host"`
	Uploads           int64          `json:"uploads"`
	OutboxSizes       map[string]int `json:"outbox_sizes"`
	RedirectCacheSize int            `json:"redirect_cache_size"`
}

type BlobMetric struct {
	Timestamp time.Time `json:"timestamp" gorm:"primaryKey"`
	Count     int64     `json:"count"`
}

type BlobMetrics struct {
	Data []BlobMetric `json:"data"`
}

var (
	validBucketSizes = map[string][]string{
		"week":     {"day"},
		"month":    {"day", "week"},
		"all_time": {"month", "week"},
	}
	validBlobMetricActions = []string{StreamTrack, ServeImage, "all"}
)

func (ss *MediorumServer) getMetrics(c echo.Context) error {
	m := Metrics{}
	m.Host = ss.Config.Self.Host
	m.Uploads = ss.uploadsCount
	m.OutboxSizes = ss.crud.GetOutboxSizes()
	m.RedirectCacheSize = ss.redirectCache.Len()

	return c.JSON(200, m)
}

func (ss *MediorumServer) getBlobsServedMetrics(c echo.Context) error {
	timeRange := c.Param("timeRange")
	if timeRange == "" || len(validBucketSizes[timeRange]) == 0 {
		return c.String(400, fmt.Sprintf("Error: bad path param %s", timeRange))
	}
	bucket := c.QueryParam("bucket_size")
	if bucket == "" || !slices.Contains(validBucketSizes[timeRange], bucket) {
		return c.String(400, fmt.Sprintf("Error: bad request param bucket_size=%s", bucket))
	}
	action := c.QueryParam("action")
	if action != "" && !slices.Contains(validBlobMetricActions, action) {
		return c.String(400, fmt.Sprintf("Error: bad request param action=%s", action))
	}

	m := BlobMetrics{}
	today := time.Now().UTC().Truncate(24 * time.Hour)
	sevenDaysAgo := today.AddDate(0, 0, -7)
	thirtyDaysAgo := today.AddDate(0, 0, -30)
	firstOfMonth := time.Date(today.Year(), today.Month(), 1, 0, 0, 0, 0, time.UTC)
	if timeRange == "week" {
		if bucket == "day" {
			var metrics []BlobMetric
			query := ss.crud.DB.
				Model(&DailyMetrics{}).
				Where("timestamp >= ? AND timestamp < ?", sevenDaysAgo, today)
			if action != "" && action != "all" {
				query = query.Select("timestamp, count").Where("action = ?", action)
			} else {
				// sum counts from all actions together
				query = query.Select("timestamp, sum(count) as count").Group("timestamp")
			}
			err := query.Order("timestamp asc").Find(&metrics).Error
			if err != nil {
				return c.JSON(400, map[string]string{
					"error": err.Error(),
				})
			}

			m.Data = metrics
		}
	}

	if timeRange == "month" {
		if bucket == "day" {
			var metrics []BlobMetric
			query := ss.crud.DB.
				Model(&DailyMetrics{}).
				Where("timestamp >= ? AND timestamp < ?", thirtyDaysAgo, today)
			if action != "" && action != "all" {
				query = query.Select("timestamp, count").Where("action = ?", action)
			} else {
				// sum counts from all actions together
				query = query.Select("timestamp, sum(count) as count").Group("timestamp")
			}
			err := query.Order("timestamp asc").Find(&metrics).Error
			if err != nil {
				return c.JSON(400, map[string]string{
					"error": err.Error(),
				})
			}

			m.Data = metrics
		} else if bucket == "week" {
			var metrics []BlobMetric
			groupBy := `date_trunc('week', timestamp)`
			query := ss.crud.DB.
				Model(&DailyMetrics{}).
				Select(groupBy+` as timestamp, sum(count) as count`).
				Where("timestamp >= ? AND timestamp < ?", thirtyDaysAgo, today).
				Group(groupBy)

			if action != "" && action != "all" {
				query = query.Where("action = ?", action)
			}
			err := query.Order("timestamp asc").Find(&metrics).Error
			if err != nil {
				return c.JSON(400, map[string]string{
					"error": err.Error(),
				})
			}

			m.Data = metrics
		}
	}

	if timeRange == "all_time" {
		if bucket == "month" {
			var metrics []BlobMetric
			query := ss.crud.DB.
				Model(&MonthlyMetrics{}).
				Where("timestamp < ?", firstOfMonth)
			if action != "" && action != "all" {
				query = query.Select("timestamp, count").Where("action = ?", action)
			} else {
				// sum counts from all actions together
				query = query.Select("timestamp, sum(count) as count").Group("timestamp")
			}
			err := query.Order("timestamp asc").Find(&metrics).Error
			if err != nil {
				return c.JSON(400, map[string]string{
					"error": err.Error(),
				})
			}

			m.Data = metrics
		} else if bucket == "week" {
			var metrics []BlobMetric
			groupBy := `date_trunc('week', timestamp)`
			query := ss.crud.DB.
				Model(&DailyMetrics{}).
				Select(groupBy+` as timestamp, sum(count) as count`).
				Where("timestamp < ?", today).
				Group(groupBy)

			if action != "" && action != "all" {
				query = query.Where("action = ?", action)
			}
			err := query.Order("timestamp asc").Find(&metrics).Error
			if err != nil {
				return c.JSON(400, map[string]string{
					"error": err.Error(),
				})
			}

			m.Data = metrics
		}
	}

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

func (ss *MediorumServer) getPgUpgradeLog(c echo.Context) error {
	return ss.getLogfile(c, "pg_upgrade.txt")
}
