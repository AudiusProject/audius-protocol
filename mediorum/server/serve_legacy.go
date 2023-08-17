package server

import (
	"context"
	"net/http"
	"net/url"
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

	ss.legacyServesMu.Lock()
	if !slices.Contains(ss.attemptedLegacyServes, cid) && len(ss.attemptedLegacyServes) < 100000 {
		ss.attemptedLegacyServes = append(ss.attemptedLegacyServes, cid)
	}
	ss.legacyServesMu.Unlock()

	diskPath := getDiskPathOnlyIfFileExists(storagePath, "", cid)
	if diskPath == "" {
		return ss.redirectToCid(c, cid)
	}

	// detect mime type and block mp3 streaming outside of the /tracks/cidstream route
	isAudioFile := isAudioFile(diskPath)
	if !strings.Contains(c.Path(), "cidstream") && isAudioFile {
		return c.String(401, "mp3 streaming is blocked. Please use Discovery /v1/tracks/:encodedId/stream")
	}

	if c.Request().Method == "HEAD" {
		return c.NoContent(200)
	}

	if err = c.File(diskPath); err != nil {
		logger.Error("error serving cid", "err", err, "storagePath", diskPath)
		return ss.redirectToCid(c, cid)
	}
	ss.legacyServesMu.Lock()
	if !slices.Contains(ss.successfulLegacyServes, cid) && len(ss.successfulLegacyServes) < 100000 {
		ss.successfulLegacyServes = append(ss.successfulLegacyServes, cid)
	}
	ss.legacyServesMu.Unlock()

	// v1 file listen
	if isAudioFile {
		go ss.logTrackListen(c)
	}

	return nil
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

	key := dirCid + "/" + fileName
	ss.legacyServesMu.Lock()
	if !slices.Contains(ss.attemptedLegacyServes, key) && len(ss.attemptedLegacyServes) < 100000 {
		ss.attemptedLegacyServes = append(ss.attemptedLegacyServes, key)
	}
	ss.legacyServesMu.Unlock()

	// dirCid is actually the CID, and fileName is a size like "150x150.jpg"
	diskPath := getDiskPathOnlyIfFileExists(storagePath, "", dirCid)
	if diskPath == "" {
		return ss.redirectToCid(c, dirCid)
	}

	// detect mime type and block mp3 streaming outside of the /tracks/cidstream route
	isAudioFile := isAudioFile(diskPath)
	if isAudioFile {
		return c.String(401, "mp3 streaming is blocked. Please use Discovery /v1/tracks/:encodedId/stream")
	}

	if c.Request().Method == "HEAD" {
		return c.NoContent(200)
	}

	if err = c.File(diskPath); err != nil {
		logger.Error("error serving dirCid", "err", err, "storagePath", diskPath)
		return ss.redirectToCid(c, dirCid)
	}
	ss.legacyServesMu.Lock()
	if !slices.Contains(ss.successfulLegacyServes, key) && len(ss.successfulLegacyServes) < 100000 {
		ss.successfulLegacyServes = append(ss.successfulLegacyServes, key)
	}
	ss.legacyServesMu.Unlock()

	return nil
}

func (ss *MediorumServer) redirectToCid(c echo.Context, cid string) error {
	// don't check additional nodes beyond what's in cid_lookup if "localOnly" is true
	if c.QueryParam("localOnly") == "true" {
		return c.String(404, "not redirecting because localOnly=true")
	}

	ctx := c.Request().Context()

	cidLookupHosts, err := ss.findHostsWithCid(ctx, cid)
	if err != nil {
		return c.String(500, "error redirecting:"+err.Error())
	}

	logger := ss.logger.With("cid", cid)
	healthyHosts := ss.findHealthyPeers(2 * time.Minute)

	// redirect to the first healthy host that we know has the cid (thanks to our cid_lookup table)
	for _, host := range cidLookupHosts {
		if !slices.Contains(healthyHosts, host) || host == ss.Config.Self.Host {
			continue
		}
		if dest, is200 := ss.diskCheckUrl(*c.Request().URL, host); is200 {
			logger.Info("redirecting to: " + dest)
			return c.Redirect(302, dest)
		}
	}

	// check healthy hosts via HEAD request to see if they have the cid but aren't in our cid_lookup
	for _, host := range healthyHosts {
		if host == ss.Config.Self.Host || slices.Contains(cidLookupHosts, host) {
			continue
		}
		if dest, is200 := ss.diskCheckUrl(*c.Request().URL, host); is200 {
			logger.Info("redirecting to: " + dest)
			ss.pgPool.Exec(ctx, `insert into cid_lookup ("multihash", "host") values ($1, $2) on conflict do nothing`, cid, host)
			return c.Redirect(302, dest)
		}
	}

	logger.Info("no healthy host found with cid")
	return c.String(404, "no healthy host found with cid: "+cid)
}

// instead of adding a new disk-check URL... we can fake it from the client side
// by not following any redirects...
// 302 => NO
// 404 => NO
// 200 => YES
func (ss *MediorumServer) diskCheckUrl(dest url.URL, hostString string) (string, bool) {
	noRedirectClient := &http.Client{
		// without this option, we'll incorrectly think Node A has it when really Node A was telling us to redirect to Node B
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
		Timeout: time.Second,
	}

	logger := ss.logger.With("redirect", "url", dest.String(), "host", hostString)

	hostUrl, err := url.Parse(hostString)
	if err != nil {
		return "", false
	}

	dest.Host = hostUrl.Host
	dest.Scheme = hostUrl.Scheme
	query := dest.Query()
	query.Add("localOnly", "true")
	dest.RawQuery = query.Encode()

	req, err := http.NewRequest("GET", dest.String(), nil)
	if err != nil {
		logger.Error("invalid url", "err", err)
		return "", false
	}
	req.Header.Set("User-Agent", "mediorum "+ss.Config.Self.Host)

	resp, err := noRedirectClient.Do(req)
	if err != nil {
		logger.Error("request failed", "err", err)
		return "", false
	}
	resp.Body.Close()
	if resp.StatusCode == 200 || resp.StatusCode == 204 || resp.StatusCode == 206 {
		return dest.String(), true
	}

	return "", false
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
	diskPath = computeFilePath(multihash)
	if _, err := os.Stat(diskPath); err == nil {
		return diskPath
	}
	diskPath = computeLegacyFilePath(multihash)
	if _, err := os.Stat(diskPath); err == nil {
		return diskPath
	}

	// try computing yet another path based on the dirMultihash
	if dirMultihash != "" {
		diskPath = computeFilePathInDir(dirMultihash, multihash)
		if _, err := os.Stat(diskPath); err == nil {
			return diskPath
		}
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
