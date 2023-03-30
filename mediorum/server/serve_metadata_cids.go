package server

import (
	"io"

	"github.com/ipfs/go-cid"
	"github.com/labstack/echo/v4"
)

func (ss *MediorumServer) postMetadataCid(c echo.Context) error {
	// read the json
	j, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return c.JSON(400, map[string]string{
			"error": "bad json" + err.Error(),
		})
	}

	// compute the cid
	builder := &cid.V0Builder{}
	cid, err := builder.Sum(j)
	if err != nil {
		return err
	}

	record := &JsonCid{
		Cid:  cid.String(),
		Data: j,
	}
	err = ss.crud.Create(record)
	if err != nil {
		return err
	}

	return c.JSON(200, map[string]string{
		"metadataMultihash": cid.String(),
		// metadataFileUUID:
	})
}
