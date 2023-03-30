package server

import (
	"bytes"
	"crypto/rand"
	"crypto/sha1"
	"encoding/base32"
	"io"
	"io/ioutil"
	"sync"
	"time"

	"github.com/ipfs/go-cid"
	util "github.com/ipfs/go-ipfs-util"
	"github.com/labstack/echo/v4"
)

var (
	filesFormFieldName = "files"
)

func (ss *MediorumServer) getUploads(c echo.Context) error {
	uploads := []*Upload{}
	ss.crud.DB.Order("created_at desc").Find(&uploads)
	return c.JSON(200, uploads)
}

func (ss *MediorumServer) getUpload(c echo.Context) error {
	var upload *Upload
	err := ss.crud.DB.First(&upload, "id = ?", c.Param("id")).Error
	if err != nil {
		return err
	}
	return c.JSON(200, upload)
}

func (ss *MediorumServer) postUpload(c echo.Context) error {
	// Multipart form
	form, err := c.MultipartForm()
	if err != nil {
		return err
	}
	template := c.FormValue("template")
	files := form.File[filesFormFieldName]
	defer form.RemoveAll()

	// each file:
	// - hash contents
	// - send to server in hashring for processing
	// - some task queue stuff

	uploads := make([]*Upload, len(files))
	wg := sync.WaitGroup{}
	wg.Add(len(files))
	for idx, formFile := range files {

		idx := idx
		formFile := formFile
		go func() {
			defer wg.Done()

			upload := &Upload{
				Status:           JobStatusNew,
				Template:         template,
				CreatedBy:        ss.Config.Self.Host,
				CreatedAt:        time.Now().UTC(),
				OrigFileName:     formFile.Filename,
				TranscodeResults: map[string]string{},
			}
			uploads[idx] = upload

			randomID, err := randomHash()
			if err != nil {
				upload.Error = err.Error()
				return
			}

			upload.ID = randomID
			upload.FFProbe, _ = ffprobeUpload(formFile)

			// mirror to n peers
			file, err := formFile.Open()
			if err != nil {
				upload.Error = err.Error()
				return
			}

			upload.Mirrors, err = ss.replicateFile(randomID, file)
			if err != nil {
				upload.Error = err.Error()
				return
			}

			ss.logger.Info("mirrored", "name", formFile.Filename, "randomID", randomID, "mirrors", upload.Mirrors)

			err = ss.crud.Create(upload)
			if err != nil {
				ss.logger.Warn("create upload failed", "err", err)
			}
		}()
	}
	wg.Wait()

	if c.QueryParam("redirect") != "" {
		return c.Redirect(302, c.Request().Referer())
	}

	return c.JSON(200, uploads)
}

func computeFileCID(file io.Reader) (string, error) {
	builder := cid.V0Builder{}
	contents, err := ioutil.ReadAll(file)
	if err != nil {
		return "", err
	}
	hash := util.Hash(contents)
	cid, err := builder.Sum(hash)
	if err != nil {
		return "", err
	}
	return cid.String(), nil
}

func randomHash() (string, error) {
	buf := make([]byte, 128)
	rand.Read(buf)
	hash := sha1.New()
	io.Copy(hash, bytes.NewReader(buf))
	fileHash := base32.StdEncoding.EncodeToString(hash.Sum(nil))
	return fileHash, nil
}
