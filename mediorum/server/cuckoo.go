package server

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
	cuckoo "github.com/panmari/cuckoofilter"
)

var (
	myCuckooKeyName = "my_cuckoo"
	cuckooMap       = map[string]*cuckoo.Filter{}
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
			"size":        filter.Count(),
			"load_factor": filter.LoadFactor(),
		}
	}
	cuckooMu.RUnlock()
	return c.JSON(200, sizes)
}

func (ss *MediorumServer) serveCuckoo(c echo.Context) error {
	ctx := c.Request().Context()
	r, err := ss.bucket.NewReader(ctx, myCuckooKeyName, nil)
	if err != nil {
		return err
	}
	defer r.Close()

	// would be nice to do some Last-Modified stuff here
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

func (ss *MediorumServer) startCuckooFetcher() error {
	for {
		for _, peer := range ss.Config.Peers {
			if peer.Host == ss.Config.Self.Host {
				continue
			}

			err := ss.fetchPeerCuckoo(peer.Host)
			if err != nil {
				ss.logger.Warn("failed to fetch peer cuckoo", "peer", peer.Host, "err", err)
			}
		}
		time.Sleep(time.Minute * 10)
	}
}

func (ss *MediorumServer) fetchPeerCuckoo(host string) error {
	client := http.Client{
		Timeout: time.Minute,
	}

	endpoint := host + "/internal/cuckoo"
	r, err := client.Get(endpoint)
	if err != nil {
		return err
	}
	defer r.Body.Close()

	if r.StatusCode != 200 {
		return fmt.Errorf("bad status: %s: %s", endpoint, r.Status)
	}

	f, err := io.ReadAll(r.Body)
	if err != nil {
		return err
	}

	filter, err := cuckoo.Decode(f)
	if err != nil {
		return err
	}

	cuckooMu.Lock()
	cuckooMap[host] = filter
	cuckooMu.Unlock()
	return nil
}

func (ss *MediorumServer) startCuckooBuilder() error {
	for {
		startTime := time.Now()
		err := ss.buildCuckoo()
		took := time.Since(startTime)
		ss.logger.Info("built cuckoo", "took", took.String(), "err", err)
		time.Sleep(time.Hour)
	}
}

func (ss *MediorumServer) buildCuckoo() error {
	ctx := context.Background()

	conn, err := ss.pgPool.Acquire(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	count := 0
	err = conn.QueryRow(ctx, `select count(*) from "Files" where type != 'track'`).Scan(&count)
	if err != nil {
		return err
	}

	cf := cuckoo.NewFilter(uint(count))

	rows, err := conn.Query(ctx, `
	select multihash from "Files" where type != 'track'
	union all
	select "dirMultihash" from "Files" where "dirMultihash" is not null`)
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
