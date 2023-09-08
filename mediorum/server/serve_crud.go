package server

import (
	"context"
	"fmt"
	"mediorum/crudr"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

const PullLimit = 10000

func (ss *MediorumServer) serveCrudSweep(c echo.Context) error {
	ss.crudSweepMutex.Lock()
	defer ss.crudSweepMutex.Unlock()

	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Minute)
	defer cancel()

	after := c.QueryParam("after")
	var ops []*crudr.Op
	err := ss.crud.DB.
		WithContext(ctx).
		Where("ulid > ?", after).
		Limit(PullLimit).
		Order("ulid asc").
		Find(&ops).
		Error
	if err != nil {
		return c.String(500, fmt.Sprintf("Failed to query ops: %v", err))
	}
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
