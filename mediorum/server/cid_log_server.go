package server

import (
	"fmt"
	"log"
	"time"

	"github.com/labstack/echo/v4"
)

func (ss *MediorumServer) servePgBeam(c echo.Context) error {
	ctx := c.Request().Context()

	after := time.Time{}
	if t, err := time.Parse(time.RFC3339, c.QueryParam("after")); err == nil {
		after = t
	}

	query := fmt.Sprintf(`
		select *
		from cid_log
		where updated_at > '%s'
		order by updated_at
		`,
		after.Format(time.RFC3339))
	copySql := fmt.Sprintf("COPY (%s) TO STDOUT", query)

	log.Println("COPY", after, copySql)

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
