package server

import (
	"bufio"
	"context"
	"net/http"

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

	req, err := http.Get(apiPath(host, "internal/qm.csv"))
	if err != nil {
		return err
	}
	defer req.Body.Close()

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

	// todo: write a record to db that we have completed this host... no need to revisit

	return nil
}
