package server

import (
	"fmt"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
)

func (ss *MediorumServer) servePgBeam(c echo.Context) error {
	ctx := c.Request().Context()

	after := time.Time{}
	if t, err := time.Parse(time.RFC3339Nano, c.QueryParam("after")); err == nil {
		after = t
	}

	batchSize := CidLookupBatchSize
	if param, err := strconv.Atoi(c.QueryParam("batchSize")); err == nil && param > 0 {
		batchSize = param
	}

	query := fmt.Sprintf(`
		select *
		from cid_log
		where updated_at > '%s'
		order by updated_at
		limit %d
		`,
		after.Format(time.RFC3339Nano), batchSize)
	copySql := fmt.Sprintf("COPY (%s) TO STDOUT", query)

	// pg COPY TO
	conn, err := ss.pgPool.Acquire(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	w := c.Response().Writer
	_, err = conn.Conn().PgConn().CopyTo(ctx, w, copySql)
	return err
}
