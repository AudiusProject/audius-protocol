package server

import (
	"context"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/labstack/echo/v4"
	"gocloud.dev/blob"
)

type cidCursor struct {
	Host      string    `json:"host"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (ss *MediorumServer) getStatus(c echo.Context) error {
	return c.JSON(200, ss)
}

func (ss *MediorumServer) getLs(c echo.Context) error {
	ctx := c.Request().Context()
	page, _, err := ss.bucket.ListPage(ctx, blob.FirstPageToken, 100, nil)
	if err != nil {
		return err
	}
	return c.JSON(200, page)
}

func (ss *MediorumServer) dumpBlobs(c echo.Context) error {
	var blobs []*Blob
	ss.crud.DB.Unscoped().Order("key, host").Find(&blobs)
	return c.JSON(200, blobs)
}

func (ss *MediorumServer) dumpUploads(c echo.Context) error {
	var uploads []*Upload
	ss.crud.DB.Unscoped().Order("id").Find(&uploads)
	return c.JSON(200, uploads)
}

func (ss *MediorumServer) debugPeers(c echo.Context) error {
	return c.JSON(200, map[string]interface{}{
		"peers":   ss.Config.Peers,
		"signers": ss.Config.Signers,
	})
}

func (ss *MediorumServer) debugCidCursor(c echo.Context) error {
	ctx := context.Background()
	cidCursors := []cidCursor{}
	sql := `select * from cid_cursor order by host`
	err := pgxscan.Select(ctx, ss.pgPool, &cidCursors, sql)

	if err != nil {
		return c.JSON(400, map[string]string{
			"error": err.Error(),
		})
	}
	return c.JSON(200, cidCursors)
}
