package server

import (
	"fmt"

	"github.com/labstack/echo/v4"
)

func (ss *MediorumServer) servePgBeam(c echo.Context) error {
	ctx := c.Request().Context()

	query := fmt.Sprintf(`
		select distinct "multihash", '%s' from "Files"
		union
		select distinct "dirMultihash", '%[1]s' from "Files" where "dirMultihash" is not null`,
		ss.Config.Self.Host)
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
