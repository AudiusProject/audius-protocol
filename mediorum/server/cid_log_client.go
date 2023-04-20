package server

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/inconshreveable/log15"
)

func (ss *MediorumServer) startBeamClient() {
	ctx := context.Background()

	// migration: create cid_lookup table
	ddl := `

	create table if not exists cid_cursor (
		"host" text primary key,
		"updated_at" timestamp with time zone NOT NULL
	);

	create table if not exists cid_lookup (
		"multihash" text,
		"host" text
	);

	create unique index if not exists "idx_multihash" on cid_lookup("multihash", "host");
	`

	_, err := ss.pgPool.Exec(ctx, ddl)
	if err != nil {
		log.Println("ddl failed", err)
		return
	}

	// polling:
	// beam cid lookup from peers on an interval
	for {
		time.Sleep(jitterSeconds(30, 60))

		if err != nil {
			log.Println("create temp table failed", err)
		}

		startedAt := time.Now()
		wg := &sync.WaitGroup{}
		for _, peer := range ss.Config.Peers {
			if peer.Host == ss.Config.Self.Host {
				continue
			}
			peer := peer
			wg.Add(1)
			go func() {
				err := ss.beamFromPeer(peer)
				if err != nil {
					log.Println("beam failed", peer.Host, err)
				}
				wg.Done()
			}()
		}
		wg.Wait()

		log.Println("beam all done", "took", time.Since(startedAt))

	}
}

func jitterSeconds(min, n int) time.Duration {
	return time.Second * time.Duration(min+rand.Intn(n-min))
}

func (ss *MediorumServer) beamFromPeer(peer Peer) error {
	ctx := context.Background()
	client := http.Client{
		Timeout: 5 * time.Minute,
	}

	var lastUpdatedAt time.Time
	ss.pgPool.QueryRow(ctx, `select updated_at from cid_cursor where `).Scan(&lastUpdatedAt)

	endpoint := fmt.Sprintf("%s?after=%s", peer.ApiPath("beam/files"), url.QueryEscape(lastUpdatedAt.Format(time.RFC3339)))
	startedAt := time.Now()
	logger := log15.New("beam_client", peer.Host)
	resp, err := client.Get(endpoint)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return errors.New(resp.Status)
	}

	// pgx COPY FROM
	conn, err := ss.pgPool.Acquire(ctx)
	if err != nil {
		logger.Warn(err.Error())
		return err
	}
	defer conn.Release()

	conn.Exec(ctx, `create temp table cid_log_temp (like cid_log)`)

	copySql := `COPY cid_log_temp FROM STDIN`
	result, err := conn.Conn().PgConn().CopyFrom(ctx, resp.Body, copySql)
	if err != nil {
		return err
	}

	conn.Exec(ctx, `insert into cid_lookup (select multihash, $1 from cid_log_temp) on conflict do nothing;`, peer.Host)

	conn.QueryRow(ctx, `select max(updated_at) from cid_log_temp`).Scan(&lastUpdatedAt)
	if !lastUpdatedAt.IsZero() {
		_, err := conn.Exec(ctx, `insert into cid_cursor values ($1, $2) on conflict (host) do update set updated_at = $2`, peer.Host, lastUpdatedAt)
		fmt.Println("update cid_cursor", err)
	}

	logger.Info("beamed", "count", result.RowsAffected(), "took", time.Since(startedAt))
	return nil
}
