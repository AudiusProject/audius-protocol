package server

import (
	"bufio"
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

const _qmFileKey = "_data/qm_cids.csv"

func (ss *MediorumServer) writeQmFile() error {
	ctx := context.Background()

	bail := func(err error) error {
		if err != nil {
			ss.bucket.Delete(ctx, _qmFileKey)
		}
		return err
	}

	// if exists do nothing
	if exists, _ := ss.bucket.Exists(ctx, _qmFileKey); exists {
		return nil
	}

	// blob writer
	blobWriter, err := ss.bucket.NewWriter(ctx, _qmFileKey, nil)
	if err != nil {
		return bail(err)
	}

	// db conn
	conn, err := ss.pgPool.Acquire(ctx)
	if err != nil {
		return bail(err)
	}
	defer conn.Release()

	// doit
	_, err = conn.Conn().PgConn().CopyTo(ctx, blobWriter, "COPY qm_cids TO STDOUT")
	if err != nil {
		return bail(err)
	}

	return bail(blobWriter.Close())
}

func (ss *MediorumServer) serveInternalQmCsv(c echo.Context) error {
	r, err := ss.bucket.NewReader(c.Request().Context(), _qmFileKey, nil)
	if err != nil {
		return err
	}
	return c.Stream(200, "text/plain", r)
}

func (ss *MediorumServer) pullQmFromPeer(host string) error {
	ctx := context.Background()

	done := false
	ss.pgPool.QueryRow(ctx, "select count(*) = 1 from qm_sync where host = $1", host).Scan(&done)
	if done {
		return nil
	}

	req, err := http.Get(apiPath(host, "internal/qm.csv"))
	if err != nil {
		return err
	}
	defer req.Body.Close()

	if req.StatusCode != 200 {
		return fmt.Errorf("bad status %d", req.StatusCode)
	}

	tx, err := ss.pgPool.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	scanner := bufio.NewScanner(req.Body)
	for scanner.Scan() {
		_, err = tx.Exec(ctx, "insert into qm_cids values ($1) on conflict do nothing", scanner.Text())
		if err != nil {
			return err
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return err
	}

	_, err = ss.pgPool.Exec(ctx, "insert into qm_sync values($1)", host)
	return err
}

func (ss *MediorumServer) startQmSyncer() {
	time.Sleep(time.Minute * 1)

	err := ss.writeQmFile()
	if err != nil {
		ss.logger.Error("qmSync: failed to write qm.csv file", "err", err)
	}

	time.Sleep(time.Minute * 1)
	for _, peer := range ss.findHealthyPeers(time.Hour) {
		if err = ss.pullQmFromPeer(peer); err != nil {
			ss.logger.Error("qmSync: failed to pull qm.csv from peer", "peer", peer, "err", err)
		} else {
			ss.logger.Debug("qmSync: pulled qm.csv from peer", "peer", peer)
		}
	}
}
