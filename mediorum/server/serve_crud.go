package server

import (
	"mediorum/crudr"
	"net/http"

	"github.com/labstack/echo/v4"
)

const PullLimit = 10000

func (ss *MediorumServer) serveCrudSweep(c echo.Context) error {
	ss.crudSweepMutex.Lock()
	defer ss.crudSweepMutex.Unlock()

	after := c.QueryParam("after")
	var ops []*crudr.Op
	ss.crud.DB.
		Where("ulid > ?", after).
		Limit(PullLimit).
		Order("ulid asc").
		Find(&ops)
	return c.JSON(200, ops)
}

func (ss *MediorumServer) serveCrudPush(c echo.Context) error {
	op := new(crudr.Op)
	if err := c.Bind(op); err != nil {
		return c.String(http.StatusBadRequest, err.Error())
	}

	known := ss.crud.KnownType(op)
	if !known {
		return c.String(406, "unknown crudr type")
	}

	return ss.crud.ApplyOp(op)
}
