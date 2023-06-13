package server

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v4"
	"github.com/sourcegraph/conc/stream"
)

func (ss *MediorumServer) serveLegacyCid(c echo.Context) error {
	ctx := c.Request().Context()
	cid := c.Param("cid")
	sql := `select "storagePath" from "Files" where "multihash" = $1 limit 1`

	// lookup on-disk storage path
	var storagePath string
	err := ss.pgPool.QueryRow(ctx, sql, cid).Scan(&storagePath)
	if err == pgx.ErrNoRows {
		return ss.redirectToCid(c, cid)
	} else if err != nil {
		return err
	}

	// detect mime type:
	// if this is not the cidstream route, we should block mp3 streaming
	// for now just set a header until we are ready to 401 (after client using cidstream everywhere)
	if !strings.Contains(c.Path(), "cidstream") && isAudioFile(storagePath) {
		c.Response().Header().Set("x-would-block", "true")
	}

	if err = c.File(storagePath); err != nil {
		log.Println("error serving cid", cid, storagePath, err)
		return ss.redirectToCid(c, cid)
	}

	return nil
}

func (ss *MediorumServer) serveLegacyDirCid(c echo.Context) error {
	ctx := c.Request().Context()
	dirCid := c.Param("dirCid")
	fileName := c.Param("fileName")

	sql := `select "storagePath" from "Files" where "dirMultihash" = $1 and "fileName" = $2`
	var storagePath string
	err := ss.pgPool.QueryRow(ctx, sql, dirCid, fileName).Scan(&storagePath)
	if err == pgx.ErrNoRows {
		return ss.redirectToCid(c, dirCid)
	} else if err != nil {
		return err
	}

	if err = c.File(storagePath); err != nil {
		log.Println("error serving dirCid", dirCid, storagePath, err)
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

	// here we would want to check that host in question is up
	// (perhaps using healthy hosts convetion from elsewhere)
	// for now just use first host
	log.Println("potential hosts for cid", cid, hosts)
	for _, host := range hosts {
		dest := replaceHost(*c.Request().URL, host)
		log.Println("redirecting to: ", dest.String())
		return c.Redirect(302, dest.String())
	}

	return errors.New("no host found with cid: " + cid)
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
		log.Println("isCidBlacklisted err", err)
	}
	return blacklisted
}

// this is a POC bulk endpoint for streaming all the type = 'metadata'
// json blobs
func (ss *MediorumServer) serveCidMetadata(c echo.Context) error {
	ctx := c.Request().Context()
	sql := `select multihash, "storagePath" from "Files" where type = 'metadata' order by multihash limit 1000000`

	rows, err := ss.pgPool.Query(ctx, sql)
	if err != nil {
		return err
	}
	defer rows.Close()

	pool := stream.New().WithMaxGoroutines(4)
	w := c.Response().Writer

	for rows.Next() {
		var cid string
		var storagePath string
		err := rows.Scan(&cid, &storagePath)
		if err != nil {
			return err
		}

		pool.Go(func() stream.Callback {
			data, err := os.ReadFile(storagePath)
			return func() {
				if err != nil {
					log.Println("err reading cid file", storagePath, cid, err)
				} else {
					fmt.Fprintf(w, "%s\t%s\n", cid, data)
				}
			}
		})
	}

	pool.Wait()
	return nil
}
