package server

import (
	"fmt"

	"github.com/labstack/echo/v4"
)

func (ss *MediorumServer) servePgBeam(c echo.Context) error {
	ctx := c.Request().Context()

	query := fmt.Sprintf(`select coalesce("dirMultihash", "multihash"), '%s' from "Files" where "type" != 'track'`, ss.Config.Self.Host)
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
