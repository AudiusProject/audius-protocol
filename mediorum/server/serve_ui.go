package server

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
)

//go:embed uis
var uiFiles embed.FS

var uiFs = getStatusStaticFiles()

func getStatusStaticFiles() http.FileSystem {
	if os.Getenv("LIVE_UI") == "true" {
		log.Print("servering UI from filesystem")
		return http.FS(os.DirFS("server/uis"))
	}

	fsys, err := fs.Sub(uiFiles, "uis")
	if err != nil {
		panic(err)
	}

	return http.FS(fsys)
}

func (ss *MediorumServer) serveUploadUI(c echo.Context) error {
	f, err := uiFs.Open("upload.html")
	if err != nil {
		return err
	}
	return c.Stream(200, "text/html", f)
}
