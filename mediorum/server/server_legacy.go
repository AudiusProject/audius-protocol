package server

import (
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/labstack/echo/v4"
)

func (ss *MediorumServer) serveLegacyIPFS(c echo.Context) error {
	cid := c.Param("cid")
	threeChars := cid[len(cid)-4 : len(cid)-1]
	log.Println("serve ipfs", cid, threeChars)

	// here we could look at postgres files table
	// for now we'll just go for it
	tryPaths := []string{
		filepath.Join(ss.Config.LegacyFSRoot, "files", threeChars, cid),
		// legacy legacy path => everything in root
		filepath.Join(ss.Config.LegacyFSRoot, cid),
	}

	for _, p := range tryPaths {
		if f, err := os.Open(p); err == nil {
			mime := sniffMimeType(f)
			return c.Stream(200, mime, f)
		} else {
			log.Println("err reading cid file", p, cid, err)
		}
	}

	return c.String(404, "no dice")
}

func (ss *MediorumServer) serveLegacyIPFS2(c echo.Context) error {
	ctx := c.Request().Context()
	cid := c.Param("cid")
	sql := `select "storagePath" from "Files" where "multihash" = $1 limit 1`

	var storagePath string
	err := ss.pgPool.QueryRow(ctx, sql, cid).Scan(&storagePath)
	if err != nil {
		return err
	}

	log.Println("serving cid", cid, storagePath)
	if f, err := os.Open(storagePath); err == nil {
		mime := sniffMimeType(f)
		return c.Stream(200, mime, f)
	} else {
		log.Println("err reading cid file", storagePath, cid, err)
	}

	return c.String(404, "no dice")
}

func sniffMimeType(r io.ReadSeeker) string {
	buffer := make([]byte, 512)
	r.Read(buffer)
	r.Seek(0, 0)
	return http.DetectContentType(buffer)
}
