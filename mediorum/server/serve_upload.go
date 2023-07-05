package server

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/url"
	"sync"
	"time"

	"github.com/ipfs/go-cid"
	"github.com/labstack/echo/v4"
	"github.com/multiformats/go-multihash"
	"github.com/oklog/ulid/v2"
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
	if upload.Status == JobStatusError {
		return c.JSON(422, upload)
	}
	return c.JSON(200, upload)
}

func (ss *MediorumServer) postUpload(c echo.Context) error {
	// Multipart form
	form, err := c.MultipartForm()
	if err != nil {
		return err
	}
	template := JobTemplate(c.FormValue("template"))
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
				ID:               ulid.Make().String(),
				Status:           JobStatusNew,
				Template:         template,
				CreatedBy:        ss.Config.Self.Host,
				CreatedAt:        time.Now().UTC(),
				OrigFileName:     formFile.Filename,
				TranscodeResults: map[string]string{},
			}
			uploads[idx] = upload

			formFileCID, err := computeFileHeaderCID(formFile)
			if err != nil {
				upload.Error = err.Error()
				return
			}

			upload.OrigFileCID = formFileCID
			upload.FFProbe, _ = ffprobeUpload(formFile)

			// mirror to n peers
			file, err := formFile.Open()
			if err != nil {
				upload.Error = err.Error()
				return
			}

			upload.Mirrors, err = ss.replicateFile(formFileCID, file)
			if err != nil {
				upload.Error = err.Error()
				return
			}

			ss.logger.Info("mirrored", "name", formFile.Filename, "uploadID", upload.ID, "cid", formFileCID, "mirrors", upload.Mirrors)

			if template == JobTemplateImgSquare || template == JobTemplateImgBackdrop {
				upload.TranscodeResults["original.jpg"] = formFileCID
			}

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

func (ss *MediorumServer) getBlobByJobIDAndVariant(c echo.Context) error {
	// If the client provided a filename, set it in the header to be auto-populated in download prompt
	filenameForDownload := c.QueryParam("filename")
	if filenameForDownload != "" {
		contentDisposition := url.QueryEscape(filenameForDownload)
		c.Response().Header().Set("Content-Disposition", "attachment; filename="+contentDisposition)
	}

	jobID := c.Param("jobID")
	variant := c.Param("variant")
	if isLegacyCID(jobID) {
		c.SetParamNames("dirCid", "fileName")
		c.SetParamValues(jobID, variant)
		return ss.serveLegacyDirCid(c)
	} else {
		var upload *Upload
		err := ss.crud.DB.First(&upload, "id = ?", jobID).Error
		if err != nil {
			return err
		}
		cid, ok := upload.TranscodeResults[variant]
		if !ok {
			msg := fmt.Sprintf("variant %s not found for upload %s", variant, jobID)
			return c.String(400, msg)
		}
		c.SetParamNames("cid")
		c.SetParamValues(cid)
		return ss.getBlob(c)
	}
}

func computeFileHeaderCID(fh *multipart.FileHeader) (string, error) {
	f, err := fh.Open()
	if err != nil {
		return "", err
	}
	defer f.Close()
	return computeFileCID(f)
}

func computeFileCID(f io.ReadSeeker) (string, error) {
	defer f.Seek(0, 0)
	builder := cid.V1Builder{}
	hash, err := multihash.SumStream(f, multihash.SHA2_256, -1)
	if err != nil {
		return "", err
	}
	cid, err := builder.Sum(hash)
	if err != nil {
		return "", err
	}
	return cid.String(), nil
}

func validateCID(expectedCID string, f io.ReadSeeker) error {
	computed, err := computeFileCID(f)
	if err != nil {
		return err
	}
	if computed != expectedCID {
		return fmt.Errorf("expected cid: %s but contents hashed to %s", expectedCID, computed)
	}
	return nil
}
