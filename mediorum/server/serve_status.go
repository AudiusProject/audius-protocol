package server

import (
	"github.com/labstack/echo/v4"
	"gocloud.dev/blob"
)

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
