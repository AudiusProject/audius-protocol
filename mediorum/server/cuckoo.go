package server

import (
	"context"
	"encoding/hex"
	"fmt"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
	cuckoo "github.com/seiflotfy/cuckoofilter"
)

// cuckoo filter is disused in favor of simpler ss.redirectCache
// this is kept here for older versions which still might fetch peer cuckoo
// but can be deleted when everyone is updated

var (
	myCuckooKeyName = "my_cuckoo"
	cuckooMap       = map[string]*cuckoo.ScalableCuckooFilter{}
	cuckooEtagMap   = map[string]string{}
	cuckooMu        = sync.RWMutex{}
)

func (ss *MediorumServer) serveCuckooLookup(c echo.Context) error {
	cid := c.Param("cid")
	hosts := ss.cuckooLookup(cid)
	return c.JSON(200, hosts)
}

func (ss *MediorumServer) serveCuckooSize(c echo.Context) error {
	sizes := map[string]any{}
	cuckooMu.RLock()
	for host, filter := range cuckooMap {
		sizes[host] = map[string]any{
			"size": filter.Count(),
			"etag": cuckooEtagMap[host],
		}
	}
	cuckooMu.RUnlock()
	return c.JSON(200, sizes)
}

func (ss *MediorumServer) serveCuckoo(c echo.Context) error {
	ctx := c.Request().Context()

	attr, err := ss.bucket.Attributes(ctx, myCuckooKeyName)
	if err != nil {
		return err
	}

	// use md5 for etag?
	etagValue := hex.EncodeToString(attr.MD5)
	if etagValue == c.Request().Header.Get("If-None-Match") {
		return c.NoContent(304)
	}

	r, err := ss.bucket.NewReader(ctx, myCuckooKeyName, nil)
	if err != nil {
		return err
	}
	defer r.Close()

	c.Response().Header().Set("ETag", etagValue)
	c.Response().Header().Set("Last-Modified", attr.ModTime.Format(time.RFC1123))

	debugFilename := fmt.Sprintf("cuckoo_%s_%s_%s.cuckoo", c.Request().Host, etagValue, attr.ModTime.Format(time.RFC3339))
	c.Response().Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, debugFilename))

	return c.Stream(200, "", r)
}

func (ss *MediorumServer) cuckooLookup(cid string) []string {
	hosts := []string{}
	cidBytes := []byte(cid)
	cuckooMu.RLock()
	for host, filter := range cuckooMap {
		if filter.Lookup(cidBytes) {
			hosts = append(hosts, host)
		}
	}
	cuckooMu.RUnlock()
	return hosts
}

func (ss *MediorumServer) startCuckooBuilder() error {
	for {
		time.Sleep(time.Minute)
		startTime := time.Now()
		err := ss.buildCuckoo()
		took := time.Since(startTime)
		ss.logger.Info("built cuckoo", "took", took.String(), "err", err)
		time.Sleep(time.Hour * 12)
	}
}

func (ss *MediorumServer) buildCuckoo() error {
	ctx := context.Background()

	conn, err := ss.pgPool.Acquire(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	cf := cuckoo.NewScalableCuckooFilter()

	// TODO: blobs table would probably eventually change to something like: 1 table for all CIDs I have, and 1 table for all CIDs in the entire network (for repair.go)
	rows, err := conn.Query(ctx, `
	select distinct key from blobs where host = $1
	order by 1
	`, ss.Config.Self.Host)
	if err != nil {
		return err
	}

	for rows.Next() {
		var cid []byte

		err := rows.Scan(&cid)
		if err != nil {
			return err
		}
		cf.Insert(cid)
	}

	return ss.bucket.WriteAll(ctx, myCuckooKeyName, cf.Encode(), nil)
}
