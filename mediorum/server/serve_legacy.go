package server

import (
	"context"
	"net/http"
	"os"
	"path/filepath"
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

	var storagePath string
	err := ss.pgPool.QueryRow(ctx, sql, cid).Scan(&storagePath)
	if err != nil && err != pgx.ErrNoRows {
		logger.Error("error querying cid storage path", "err", err)
	}

	diskPath := getDiskPathOnlyIfFileExists(storagePath, "", cid)
	if diskPath == "" {
		return ss.redirectToCid(c, cid, true)
	}

	// detect mime type and block mp3 streaming outside of the /tracks/cidstream route
	isAudioFile := isAudioFile(diskPath)
	if !strings.Contains(c.Path(), "cidstream") && isAudioFile {
		return c.String(401, "mp3 streaming is blocked. Please use Discovery /v1/tracks/:encodedId/stream")
	}

	if err = c.File(diskPath); err != nil {
		logger.Error("error serving cid", "err", err, "storagePath", diskPath)
		return ss.redirectToCid(c, cid, true)
	}

	// v1 file listen
	if isAudioFile {
		go ss.logTrackListen(c)
	}

	return nil
}

func (ss *MediorumServer) headLegacyCid(c echo.Context) error {
	ctx := c.Request().Context()
	cid := c.Param("cid")
	logger := ss.logger.With("cid", cid)
	sql := `select "storagePath" from "Files" where "multihash" = $1 limit 1`

	var storagePath string
	err := ss.pgPool.QueryRow(ctx, sql, cid).Scan(&storagePath)
	if err != nil && err != pgx.ErrNoRows {
		logger.Error("error querying cid storage path", "err", err)
	}

	diskPath := getDiskPathOnlyIfFileExists(storagePath, "", cid)
	if diskPath == "" {
		return ss.redirectToCid(c, cid, false)
	}

	// detect mime type and block mp3 streaming outside of the /tracks/cidstream route
	isAudioFile := isAudioFile(diskPath)
	if !strings.Contains(c.Path(), "cidstream") && isAudioFile {
		return c.String(401, "mp3 streaming is blocked. Please use Discovery /v1/tracks/:encodedId/stream")
	}

	if _, err := os.Stat(diskPath); os.IsNotExist(err) {
		return ss.redirectToCid(c, cid, false)
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
	if err != nil && err != pgx.ErrNoRows {
		logger.Error("error querying dirCid storage path", "err", err)
	}

	// dirCid is actually the CID, and fileName is a size like "150x150.jpg"
	diskPath := getDiskPathOnlyIfFileExists(storagePath, "", dirCid)
	if diskPath == "" {
		return ss.redirectToCid(c, dirCid, true)
	}

	// detect mime type and block mp3 streaming outside of the /tracks/cidstream route
	isAudioFile := isAudioFile(diskPath)
	if isAudioFile {
		return c.String(401, "mp3 streaming is blocked. Please use Discovery /v1/tracks/:encodedId/stream")
	}

	if err = c.File(diskPath); err != nil {
		logger.Error("error serving dirCid", "err", err, "storagePath", diskPath)
		return ss.redirectToCid(c, dirCid, true)
	}

	return nil
}

func (ss *MediorumServer) headLegacyDirCid(c echo.Context) error {
	ctx := c.Request().Context()
	dirCid := c.Param("dirCid")
	fileName := c.Param("fileName")
	logger := ss.logger.With("dirCid", dirCid)

	sql := `select "storagePath" from "Files" where "dirMultihash" = $1 and "fileName" = $2`
	var storagePath string
	err := ss.pgPool.QueryRow(ctx, sql, dirCid, fileName).Scan(&storagePath)
	if err != nil && err != pgx.ErrNoRows {
		logger.Error("error querying dirCid storage path", "err", err)
	}

	// dirCid is actually the CID, and fileName is a size like "150x150.jpg"
	diskPath := getDiskPathOnlyIfFileExists(storagePath, "", dirCid)
	if diskPath == "" {
		return ss.redirectToCid(c, dirCid, false)
	}

	// detect mime type and block mp3 streaming outside of the /tracks/cidstream route
	isAudioFile := isAudioFile(diskPath)
	if isAudioFile {
		return c.String(401, "mp3 streaming is blocked. Please use Discovery /v1/tracks/:encodedId/stream")
	}

	if _, err := os.Stat(diskPath); os.IsNotExist(err) {
		return ss.redirectToCid(c, dirCid, false)
	}

	return c.NoContent(200)
}

func (ss *MediorumServer) redirectToCid(c echo.Context, cid string, checkAllNodes bool) error {
	ctx := c.Request().Context()

	// don't redirect if the legacy "localOnly" query parameter is set
	if c.QueryParam("localOnly") == "true" {
		return c.String(404, "not redirecting because localOnly=true")
	}

	hosts, err := ss.findHostsWithCid(ctx, cid)
	if err != nil {
		return c.String(500, "error redirecting:"+err.Error())
	}

	logger := ss.logger.With("cid", cid)
	logger.Info("potential hosts for cid", "hosts", hosts)
	healthyHosts := ss.findHealthyPeers(2 * time.Minute)

	// redirect to the first healthy host that we know has the cid (thanks to our cid_lookup table)
	for _, host := range hosts {
		if !slices.Contains(healthyHosts, host) {
			logger.Info("host not healthy; skipping", "host", host)
			continue
		}
		dest := replaceHost(*c.Request().URL, host)
		logger.Info("redirecting to: " + dest.String())
		return c.Redirect(302, dest.String())
	}

	// check all healthy hosts via HEAD request to see if they have the cid but aren't in cid_lookup
	if checkAllNodes {
		for _, host := range healthyHosts {
			dest := replaceHost(*c.Request().URL, host)
			req, err := http.NewRequest("HEAD", "https:"+dest.String(), nil)
			if err != nil {
				logger.Error("error creating HEAD request", "err", err)
				continue
			}
			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				logger.Error("error sending HEAD request", "err", err)
				continue
			}
			if resp.StatusCode == 200 || resp.StatusCode == 204 || resp.StatusCode == 206 || resp.StatusCode == 302 || resp.StatusCode == 304 {
				dest.Query().Add("localOnly", "true")
				return c.Redirect(302, dest.String())
			}
		}
	}

	logger.Info("no healthy host found with cid")
	return c.String(404, "no healthy host found with cid: "+cid)
}

func (ss *MediorumServer) findHostsWithCid(ctx context.Context, cid string) ([]string, error) {
	var hosts []string
	sql := `select "host" from cid_lookup where "multihash" = $1 and "host" is not null order by random()`
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

// Try all fallback file paths for a given CID, and return "" if the file doesn't exist at any path. See creator-node/fsutils.ts
func getDiskPathOnlyIfFileExists(storagePath, dirMultihash, multihash string) string {
	// happy path: file exists at the expected storage path
	diskPath := storagePath
	if _, err := os.Stat(diskPath); err == nil {
		return diskPath
	}

	// try computing the path different ways that were previously used by the legacy creator node
	if dirMultihash != "" {
		diskPath = computeFilePathInDir(dirMultihash, multihash)
		if _, err := os.Stat(diskPath); err == nil {
			return diskPath
		}
	}
	diskPath = computeFilePath(multihash)
	if _, err := os.Stat(diskPath); err == nil {
		return diskPath
	}
	diskPath = computeLegacyFilePath(multihash)
	if _, err := os.Stat(diskPath); err == nil {
		return diskPath
	}

	// we tried everything, and there's no other location we can think of to find the CID at
	return ""
}

const DiskStoragePath string = "/file_storage"

func computeLegacyFilePath(cid string) string {
	return filepath.Join(DiskStoragePath, cid)
}

func computeFilePathInDir(dirName string, cid string) string {
	parentDirPath := computeFilePath(dirName)
	return filepath.Join(parentDirPath, cid)
}

func computeFilePath(cid string) string {
	storageLocationForCid := getStorageLocationForCID(cid)
	return filepath.Join(storageLocationForCid, cid)
}

func getStorageLocationForCID(cid string) string {
	directoryID := cid[len(cid)-4 : len(cid)-1]
	storageLocationForCid := filepath.Join(
		DiskStoragePath,
		"files",
		directoryID,
	)
	return storageLocationForCid
}
