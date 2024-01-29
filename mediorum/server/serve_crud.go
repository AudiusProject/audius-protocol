package server

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/AudiusProject/audius-protocol/mediorum/crudr"

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

	// some peers can't talk to each other, so we do some gossip
	// before we'd send all ops to all peers gossip style
	// but this is a bit excessive what with the bandwidth
	// so we only forward ops for which we are an orig upload mirror
	// thus using rendezvous for gossip forwarding
	filteredOps := make([]*crudr.Op, 0, len(ops)/2)
	myHost := []byte(ss.Config.Self.Host)
	for _, op := range ops {
		// if our host doesn't appear in the record, we are not a mirror
		if op.Table == "uploads" && !bytes.Contains(op.Data, myHost) {
			continue
		}
		filteredOps = append(filteredOps, op)
	}

	c.Response().Header().Set(echo.HeaderCacheControl, "public, max-age=300")
	return c.JSON(200, filteredOps)
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
