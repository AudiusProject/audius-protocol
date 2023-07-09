package server

import (
	"context"
	"os"
	"strings"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v4"
	"golang.org/x/exp/slices"
)

func (ss *MediorumServer) serveLegacyCid(c echo.Context) error {
	ctx := c.Request().Context()
	cid := c.Param("cid")
	logger := ss.logger.With("cid", cid)
	sql := `select "storagePath" from "Files" where "multihash" = $1 limit 1`

	// lookup on-disk storage path
	var storagePath string
	err := ss.pgPool.QueryRow(ctx, sql, cid).Scan(&storagePath)
	if err == pgx.ErrNoRows {
		return ss.redirectToCid(c, cid)
	} else if err != nil {
		logger.Error("error querying cid storage path", "err", err)
		return err
	}

	// detect mime type:
	// if this is not the cidstream route, we should block mp3 streaming
	// for now just set a header until we are ready to 401 (after client using cidstream everywhere)
	if !strings.Contains(c.Path(), "cidstream") && isAudioFile(storagePath) {
		c.Response().Header().Set("x-would-block", "true")
	}

	if err = c.File(storagePath); err != nil {
		logger.Error("error serving cid", "err", err, "storagePath", storagePath)
		return ss.redirectToCid(c, cid)
	}

	// v1 file listen
	go ss.logTrackListen(c)

	return nil
}

func (ss *MediorumServer) headLegacyCid(c echo.Context) error {
	ctx := c.Request().Context()
	cid := c.Param("cid")
	logger := ss.logger.With("cid", cid)
	sql := `select "storagePath" from "Files" where "multihash" = $1 limit 1`

	var storagePath string
	err := ss.pgPool.QueryRow(ctx, sql, cid).Scan(&storagePath)
	if err == pgx.ErrNoRows {
		return ss.redirectToCid(c, cid)
	} else if err != nil {
		logger.Error("error querying cid storage path", "err", err)
		return err
	}

	if _, err := os.Stat(storagePath); os.IsNotExist(err) {
		return ss.redirectToCid(c, cid)
	}

	return c.NoContent(200)
}

func (ss *MediorumServer) serveLegacyDirCid(c echo.Context) error {
	ctx := c.Request().Context()
	dirCid := c.Param("dirCid")
	fileName := c.Param("fileName")
	logger := ss.logger.With("dirCid", dirCid)

	sql := `select "storagePath" from "Files" where "dirMultihash" = $1 and "fileName" = $2`
	var storagePath string
	err := ss.pgPool.QueryRow(ctx, sql, dirCid, fileName).Scan(&storagePath)
	if err == pgx.ErrNoRows {
		return ss.redirectToCid(c, dirCid)
	} else if err != nil {
		logger.Error("error querying dirCid storage path", "err", err)
		return err
	}

	if err = c.File(storagePath); err != nil {
		logger.Error("error serving dirCid", "err", err, "storagePath", storagePath)
		return ss.redirectToCid(c, dirCid)
	}

	return nil
}

func (ss *MediorumServer) redirectToCid(c echo.Context, cid string) error {
	ctx := c.Request().Context()

	// don't redirect if the legacy "localOnly" query parameter is set
	if c.QueryParam("localOnly") == "true" {
		return c.String(404, "not redirecting because localOnly=true")
	}

	hosts, err := ss.findHostsWithCid(ctx, cid)
	if err != nil {
		return err
	}

	logger := ss.logger.With("cid", cid)
	logger.Info("potential hosts for cid", "hosts", hosts)
	healthyHosts := ss.findHealthyPeers(2 * time.Minute)

	for _, host := range hosts {
		if !slices.Contains(healthyHosts, host) {
			logger.Info("host not healthy; skipping", "host", host)
			continue
		}
		dest := replaceHost(*c.Request().URL, host)
		logger.Info("redirecting to: " + dest.String())
		return c.Redirect(302, dest.String())
	}

	logger.Info("no healthy host found with cid")
	return c.String(404, "no healthy host found with cid: "+cid)
}

func (ss *MediorumServer) findHostsWithCid(ctx context.Context, cid string) ([]string, error) {
	var hosts []string
	sql := `select "host" from cid_lookup where "multihash" = $1 order by random()`
	err := pgxscan.Select(ctx, ss.pgPool, &hosts, sql, cid)
	return hosts, err
}

func (ss *MediorumServer) isCidBlacklisted(ctx context.Context, cid string) bool {
	blacklisted := false
	sql := `SELECT COALESCE(
	                (SELECT "delisted"
	                 FROM "track_delist_statuses"
	                 WHERE "trackCid" = $1
	                 ORDER BY "createdAt" DESC
	                 LIMIT 1),
	            false)`
	err := ss.pgPool.QueryRow(ctx, sql, cid).Scan(&blacklisted)
	if err != nil {
		ss.logger.Error("isCidBlacklisted error", "err", err, "cid", cid)
	}
	return blacklisted
}
