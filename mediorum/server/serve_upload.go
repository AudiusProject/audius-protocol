package server

import (
	"database/sql"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"strconv"
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

func (ss *MediorumServer) updateUpload(c echo.Context) error {
	// Parse X-User-Id header
	userIdHeader := c.Request().Header.Get("X-User-Id")
	if userIdHeader == "" {
		return c.String(400, "user id required to edit upload")
	}
	userId, err := strconv.Atoi(userIdHeader)
	if err != nil {
		return c.String(400, "error parsing X-User-Id header: "+err.Error())
	}

	var upload *Upload
	err = ss.crud.DB.First(&upload, "id = ?", c.Param("id")).Error
	if err != nil {
		return err
	}

	// Validate requesting user matches user that uploaded the file
	if !upload.UserID.Valid || upload.UserID.Int64 != int64(userId) {
		return c.String(403, "can only edit files that you uploaded")
	}

	// Multipart form
	form, err := c.MultipartForm()
	if err != nil {
		return err
	}
	previewStartSeconds := sql.NullInt64{Valid: false}
	previewStartSecondsString := c.FormValue("previewStartSeconds")
	if previewStartSecondsString != "" {
		previewStartSecondsInt, err := strconv.Atoi(previewStartSecondsString)
		if err != nil {
			errMsg := "error parsing previewStartSeconds"
			ss.logger.Error(errMsg, err)
			return c.String(400, errMsg+": "+err.Error())
		}

		previewStartSeconds = sql.NullInt64{
			Int64: int64(previewStartSecondsInt),
			Valid: true,
		}
	}
	defer form.RemoveAll()

	// Update supported editable fields
	// TODO support removing track preview?
	if previewStartSeconds != upload.PreviewStartSeconds {
		upload.PreviewStartSeconds = previewStartSeconds
		upload.UpdatedAt = time.Now().UTC()
		upload.Status = JobStatusRetranscode

		err = ss.crud.Update(upload)
		if err != nil {
			ss.logger.Warn("update upload failed", "err", err)
		}
	}

	return c.JSON(200, upload)
}

func (ss *MediorumServer) postUpload(c echo.Context) error {
	// Parse X-User-Id header
	userIdHeader := c.Request().Header.Get("X-User-Id")
	userId := sql.NullInt64{Valid: false}
	if userIdHeader != "" {
		userIdInt, err := strconv.Atoi(userIdHeader)
		if err != nil {
			ss.logger.Warn("error parsing X-User-Id header", "err", err)
		} else {
			userId = sql.NullInt64{
				Int64: int64(userIdInt),
				Valid: true,
			}
		}
	}

	// Multipart form
	form, err := c.MultipartForm()
	if err != nil {
		return err
	}
	template := JobTemplate(c.FormValue("template"))
	previewStartSeconds := sql.NullInt64{Valid: false}
	previewStartSecondsString := c.FormValue("previewStartSeconds")
	if previewStartSecondsString != "" {
		previewStartSecondsInt, err := strconv.Atoi(previewStartSecondsString)
		if err != nil {
			errMsg := "error parsing previewStartSeconds"
			ss.logger.Error(errMsg, err)
			return c.String(400, errMsg+": "+err.Error())
		}

		previewStartSeconds = sql.NullInt64{
			Int64: int64(previewStartSecondsInt),
			Valid: true,
		}
	}
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

			now := time.Now().UTC()
			upload := &Upload{
				ID:                  ulid.Make().String(),
				UserID:              userId,
				Status:              JobStatusNew,
				Template:            template,
				PreviewStartSeconds: previewStartSeconds,
				CreatedBy:           ss.Config.Self.Host,
				CreatedAt:           now,
				UpdatedAt:           now,
				OrigFileName:        formFile.Filename,
				TranscodeResults:    map[string]string{},
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
	// if the client provided a filename, set it in the header to be auto-populated in download prompt
	filenameForDownload := c.QueryParam("filename")
	if filenameForDownload != "" {
		contentDisposition := mime.QEncoding.Encode("utf-8", filenameForDownload)
		c.Response().Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, contentDisposition))
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
