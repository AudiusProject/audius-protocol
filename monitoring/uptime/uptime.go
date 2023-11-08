package main

import (
	"encoding/json"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"sync"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.etcd.io/bbolt"
)

var (
	UptimeBucket = []byte("UptimeRecords")
)

type Uptime struct {
	quit   chan os.Signal
	logger *slog.Logger
	Config Config
	DB     *bbolt.DB
}

func New(config Config) (*Uptime, error) {
	// validate host config
	if config.Self.Host == "" {
		log.Fatal("host is required")
	} else if hostUrl, err := url.Parse(config.Self.Host); err != nil {
		log.Fatal("invalid host: ", err, "host", hostUrl)
	}

	logger := slog.With("self", config.Self.Host)

	// ensure dir
	if err := os.MkdirAll(config.Dir, os.ModePerm); err != nil {
		logger.Error("failed to create BoltDB dir", "err", err)
	}

	// initialize BoltDB
	db, err := bbolt.Open(config.Dir+"/uptime.db", 0666, nil)
	if err != nil {
		log.Fatal(err)
	}
	err = db.Update(func(tx *bbolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists(UptimeBucket)
		return err
	})
	if err != nil {
		log.Fatal(err)
	}

	u := &Uptime{
		quit:   make(chan os.Signal, 1),
		logger: logger,
		Config: config,
		DB:     db,
	}

	return u, nil
}

func (u *Uptime) Start() {
	go u.startHealthPoller()

	e := echo.New()
	e.HideBanner = true
	e.Debug = true

	e.Use(middleware.Recover())
	e.Use(middleware.Logger())
	e.Use(middleware.CORS())
	e.Use(middleware.Gzip())

	e.GET("/health_check", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"healthy": "true",
		})
	})
	e.GET("/uptime", u.handleUptime)

	e.Logger.Fatal(e.Start(":" + u.Config.ListenPort))

	// signals
	signal.Notify(u.quit, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	<-u.quit
	close(u.quit)

	u.Stop()
}

func (u *Uptime) Stop() {
	u.logger.Info("stopping")
	if u.DB != nil {
		err := u.DB.Close()
		if err != nil {
			u.logger.Error("error closing db", "err", err)
		}
	}
	u.logger.Info("bye")
}

func (u *Uptime) startHealthPoller() {
	time.Sleep(time.Second)

	u.logger.Info("starting health poller")

	u.pollHealth()
	ticker := time.NewTicker(time.Hour)
	for range ticker.C {
		u.pollHealth()
	}
}

func (u *Uptime) pollHealth() {
	httpClient := http.Client{
		Timeout: time.Second,
	}
	wg := sync.WaitGroup{}
	wg.Add(len(u.Config.Peers))
	for _, peer := range u.Config.Peers {
		peer := peer
		go func() {
			defer wg.Done()
			req, err := http.NewRequest("GET", apiPath(peer.Host, "/health_check"), nil)
			if err != nil {
				u.recordNodeUptimeToDB(peer.Host, false)
				return
			}
			req.Header.Set("User-Agent", "peer health monitor "+u.Config.Self.Host)
			resp, err := httpClient.Do(req)
			if err != nil {
				u.recordNodeUptimeToDB(peer.Host, false)
				return
			}
			defer resp.Body.Close()

			// read body
			var response map[string]interface{}
			decoder := json.NewDecoder(resp.Body)
			err = decoder.Decode(&response)
			if err != nil {
				u.recordNodeUptimeToDB(peer.Host, false)
				return
			}

			// check if node is online and 200 for health check
			u.recordNodeUptimeToDB(peer.Host, resp.StatusCode == 200)
		}()
	}
	wg.Wait()
}

type UptimeResponse struct {
	Host             string  `json:"host"`
	UptimePercentage float64 `json:"uptime_percentage"`
	Duration         string  `json:"duration"`
	UptimeHours      []bool  `json:"uptime_raw_data"`
}

func (u *Uptime) handleUptime(c echo.Context) error {
	host := c.QueryParam("host")
	if host == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Peer host is required")
	}

	durationHours := c.QueryParam("durationHours")
	if durationHours == "" {
		durationHours = "24"
	}

	hours, err := strconv.Atoi(durationHours)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid durationHours value")
	}

	duration := time.Duration(hours) * time.Hour

	uptimePercentage, uptimeHours, err := u.calculateUptime(host, duration)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Error calculating uptime: "+err.Error())
	}

	resp := UptimeResponse{
		Host:             host,
		UptimePercentage: uptimePercentage,
		Duration:         fmt.Sprintf("%dh", hours),
		UptimeHours:      uptimeHours,
	}

	return c.JSON(http.StatusOK, resp)
}

// calculateUptime returns the uptime percentage for a given host over a given duration.
// TODO: This could aggregate on a daily/weekly/monthly basis to avoid having to iterate over all hourly records.
func (u *Uptime) calculateUptime(host string, duration time.Duration) (float64, []bool, error) {
	var upCount, totalCount int
	var uptimeHours []bool

	endTime := time.Now().UTC().Truncate(time.Hour)
	startTime := endTime.Add(-duration)

	err := u.DB.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket(UptimeBucket)

		// iterate from the most recent to the oldest records until we cover the duration
		for t := endTime; !t.Before(startTime); t = t.Add(-time.Hour) {
			hourKey := []byte(t.Format("2006-01-02T15"))

			peerBucket := b.Bucket(hourKey)
			if peerBucket != nil {
				value := peerBucket.Get([]byte(host))
				totalCount++
				isUp := string(value) == "1"
				uptimeHours = append(uptimeHours, isUp)

				if isUp {
					upCount++
				}
			} else {
				// if there's no record for that hour, assume down
				uptimeHours = append(uptimeHours, false)
			}
		}
		return nil
	})

	if err != nil {
		return 0, nil, err
	}

	if totalCount == 0 {
		return 0, uptimeHours, nil
	}

	uptimePercentage := (float64(upCount) / float64(totalCount)) * 100
	return uptimePercentage, uptimeHours, nil
}

func (u *Uptime) recordNodeUptimeToDB(host string, wasUp bool) {
	currentTime := time.Now().UTC().Truncate(time.Hour)
	u.DB.Update(func(tx *bbolt.Tx) error {
		b := tx.Bucket(UptimeBucket)
		hourKey := []byte(currentTime.Format("2006-01-02T15"))
		peerBucket, err := b.CreateBucketIfNotExists(hourKey)
		if err != nil {
			return err
		}
		status := []byte("0") // assume down
		if wasUp {
			status = []byte("1") // up
		}
		return peerBucket.Put([]byte(host), status)
	})
}
