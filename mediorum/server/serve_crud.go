package server

import (
	"mediorum/crudr"
	"net/http"

	"github.com/labstack/echo/v4"
)

const PullLimit = 10000

func (ss *MediorumServer) serveCrudSweep(c echo.Context) error {
	after := c.QueryParam("after")
	var ops []*crudr.Op
	ss.crud.DB.
		Where("host = ? AND ulid >= ?", ss.Config.Self.Host, after).
		Limit(PullLimit).
		Find(&ops)
	return c.JSON(200, ops)
}

func (ss *MediorumServer) serveCrudPush(c echo.Context) error {
	op := new(crudr.Op)
	if err := c.Bind(op); err != nil {
		return c.String(http.StatusBadRequest, err.Error())
	}

	return ss.crud.ApplyOp(op)
}
