package server

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/sourcegraph/conc/stream"
)

func (ss *MediorumServer) serveLegacyCid(c echo.Context) error {
	ctx := c.Request().Context()
	cid := c.Param("cid")
	sql := `select "storagePath" from "Files" where "multihash" = $1 limit 1`

	var storagePath string
	err := ss.pgPool.QueryRow(ctx, sql, cid).Scan(&storagePath)
	if err != nil {
		if ok := ss.redirectToCid(c, cid); ok {
			return nil
		}
		return err
	}

	log.Println("serving cid", cid, storagePath)
	return c.File(storagePath)
}

func (ss *MediorumServer) serveLegacyDirCid(c echo.Context) error {
	ctx := c.Request().Context()
	dirCid := c.Param("dirCid")
	fileName := c.Param("fileName")
	sql := `select "storagePath" from "Files" where "dirMultihash" = $1 and "fileName" = $2`

	var storagePath string
	err := ss.pgPool.QueryRow(ctx, sql, dirCid, fileName).Scan(&storagePath)
	if err != nil {
		if ok := ss.redirectToCid(c, dirCid); ok {
			return nil
		}
		return err
	}

	log.Println("serving dirCid", dirCid, fileName, storagePath)
	return c.File(storagePath)
}

func (ss *MediorumServer) redirectToCid(c echo.Context, cid string) bool {
	ctx := c.Request().Context()
	// here instead of just finding one host with cid...
	// we could lookup all
	// and loop over, do double tripple check
	// and redirect to first one that's OK
	if host, err := ss.findCid(ctx, cid); err == nil {
		dest := host + c.Request().URL.Path
		// double tripple check here
		log.Println("redirecting to", dest)
		c.Redirect(302, dest)
		return true
	}
	return false
}

func (ss *MediorumServer) findCid(ctx context.Context, cid string) (string, error) {
	var host string
	sql := `select "host" from cid_lookup where "multihash" = $1`
	err := ss.pgPool.QueryRow(ctx, sql, cid).Scan(&host)
	if err != nil {
		log.Println("findCid err", err)
		return "", err
	}
	return host, nil
}

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
