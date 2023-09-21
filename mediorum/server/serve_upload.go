package server

import (
	"database/sql"
	"fmt"
	"io"
	"mediorum/cidutil"
	"mime"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/oklog/ulid/v2"
	"gocloud.dev/blob"
	"golang.org/x/sync/errgroup"
)

var (
	filesFormFieldName = "files"
)

func (ss *MediorumServer) getUpload(c echo.Context) error {
	var upload *Upload
	err := ss.crud.DB.First(&upload, "id = ?", c.Param("id")).Error
	if err != nil {
		return echo.NewHTTPError(404, err.Error())
	}
	if upload.Status == JobStatusError {
		return c.JSON(422, upload)
	}
	return c.JSON(200, upload)
}

func (ss *MediorumServer) serveUploadList(c echo.Context) error {
	afterCursor, _ := time.Parse(time.RFC3339Nano, c.QueryParam("after"))
	var uploads []Upload
	err := ss.crud.DB.
		Where("created_at > ? or transcoded_at > ?", afterCursor, afterCursor).
		Order(`created_at, transcoded_at`).Limit(1000).Find(&uploads).Error
	if err != nil {
		return err
	}
	return c.JSON(200, uploads)
}

type UpdateUploadBody struct {
	PreviewStartSeconds string `json:"previewStartSeconds"`
}

func (ss *MediorumServer) updateUpload(c echo.Context) error {
	if !ss.diskHasSpace() {
		return c.String(http.StatusServiceUnavailable, "disk is too full to accept new uploads")
	}

	var upload *Upload
	err := ss.crud.DB.First(&upload, "id = ?", c.Param("id")).Error
	if err != nil {
		return err
	}

	// Validate signer wallet matches uploader's wallet
	signerWallet, ok := c.Get("signer-wallet").(string)
	if !ok || signerWallet == "" {
		return c.String(http.StatusBadRequest, "error recovering wallet from signature")
	}
	if !upload.UserWallet.Valid {
		return c.String(http.StatusBadRequest, "upload cannot be updated because it does not have an associated user wallet")
	}
	if !strings.EqualFold(signerWallet, upload.UserWallet.String) {
		return c.String(http.StatusUnauthorized, "request signer's wallet does not match uploader's wallet")
	}

	body := new(UpdateUploadBody)
	if err := c.Bind(body); err != nil {
		return c.String(http.StatusBadRequest, err.Error())
	}

	selectedPreview := sql.NullString{Valid: false}
	if body.PreviewStartSeconds != "" {
		previewStartSeconds, err := strconv.ParseFloat(body.PreviewStartSeconds, 64)
		if err != nil {
			return c.String(http.StatusBadRequest, "error parsing previewStartSeconds: "+err.Error())
		}
		selectedPreviewString := fmt.Sprintf("320_preview|%g", previewStartSeconds)
		selectedPreview = sql.NullString{
			Valid:  true,
			String: selectedPreviewString,
		}
	}

	// Update supported editable fields

	// Do not support deleting previews
	if selectedPreview.Valid && selectedPreview != upload.SelectedPreview {
		upload.SelectedPreview = selectedPreview
		upload.UpdatedAt = time.Now().UTC()
		if _, alreadyTranscoded := upload.TranscodeResults[selectedPreview.String]; !alreadyTranscoded {
			// Have not transcoded a preview at this start time yet
			// Set status to trigger retranscode job
			upload.Status = JobStatusRetranscode
		}
		err = ss.crud.Update(upload)
		if err != nil {
			ss.logger.Warn("update upload failed", "err", err)
		}
	}

	return c.JSON(200, upload)
}

func (ss *MediorumServer) postUpload(c echo.Context) error {
	if !ss.diskHasSpace() {
		return c.String(http.StatusServiceUnavailable, "disk is too full to accept new uploads")
	}

	// Parse X-User-Wallet header
	userWalletHeader := c.Request().Header.Get("X-User-Wallet-Addr")
	userWallet := sql.NullString{Valid: false}
	if userWalletHeader != "" {
		userWallet = sql.NullString{
			String: userWalletHeader,
			Valid:  true,
		}
	}

	// Multipart form
	form, err := c.MultipartForm()
	if err != nil {
		return err
	}
	template := JobTemplate(c.FormValue("template"))
	selectedPreview := sql.NullString{Valid: false}
	previewStart := c.FormValue("previewStartSeconds")
	if previewStart != "" {
		previewStartSeconds, err := strconv.ParseFloat(previewStart, 64)
		if err != nil {
			return c.String(http.StatusBadRequest, "error parsing previewStartSeconds: "+err.Error())
		}
		selectedPreviewString := fmt.Sprintf("320_preview|%g", previewStartSeconds)
		selectedPreview = sql.NullString{
			Valid:  true,
			String: selectedPreviewString,
		}
	}
	files := form.File[filesFormFieldName]
	defer form.RemoveAll()

	// each file:
	// - hash contents
	// - send to server in hashring for processing
	// - some task queue stuff

	uploads := make([]*Upload, len(files))
	wg, _ := errgroup.WithContext(c.Request().Context())
	for idx, formFile := range files {

		idx := idx
		formFile := formFile
		wg.Go(func() error {
			now := time.Now().UTC()
			upload := &Upload{
				ID:               ulid.Make().String(),
				UserWallet:       userWallet,
				Status:           JobStatusNew,
				Template:         template,
				SelectedPreview:  selectedPreview,
				CreatedBy:        ss.Config.Self.Host,
				CreatedAt:        now,
				UpdatedAt:        now,
				OrigFileName:     formFile.Filename,
				TranscodeResults: map[string]string{},
			}
			uploads[idx] = upload

			formFileCID, err := cidutil.ComputeFileHeaderCID(formFile)
			if err != nil {
				upload.Error = err.Error()
				return err
			}

			upload.OrigFileCID = formFileCID
			upload.FFProbe, err = ffprobeUpload(formFile)
			if err != nil && upload.Template == JobTemplateAudio {
				// fail audio upload if ffprobe fails
				upload.Error = err.Error()
				return err
			}

			// mirror to n peers
			file, err := formFile.Open()
			if err != nil {
				upload.Error = err.Error()
				return err
			}

			upload.Mirrors, err = ss.replicateFile(formFileCID, file)
			if err != nil {
				upload.Error = err.Error()
				return err
			}

			ss.logger.Info("mirrored", "name", formFile.Filename, "uploadID", upload.ID, "cid", formFileCID, "mirrors", upload.Mirrors)

			if template == JobTemplateImgSquare || template == JobTemplateImgBackdrop {
				upload.TranscodeResults["original.jpg"] = formFileCID
			}

			return ss.crud.Create(upload)
		})
	}

	status := 200
	if err := wg.Wait(); err != nil {
		status = 422
	}

	return c.JSON(status, uploads)
}

func (ss *MediorumServer) getBlobByJobIDAndVariant(c echo.Context) error {
	// images are small enough to always serve all at once (no 206 range responses)
	c.Request().Header.Del("Range")

	ctx := c.Request().Context()
	jobID := c.Param("jobID")
	variant := c.Param("variant")
	isOriginalJpg := variant == "original.jpg"

	// helper function... only sets cache-control header on success
	serveSuccessWithReader := func(blob *blob.Reader) error {
		name := fmt.Sprintf("%s/%s", jobID, variant)
		c.Response().Header().Set(echo.HeaderCacheControl, "public, max-age=2592000, immutable")
		http.ServeContent(c.Response(), c.Request(), name, blob.ModTime(), blob)
		return blob.Close()
	}

	serveSuccess := func(blobPath string) error {
		if blob, err := ss.bucket.NewReader(ctx, blobPath, nil); err == nil {
			return serveSuccessWithReader(blob)
		} else {
			return err
		}
	}

	// if the client provided a filename, set it in the header to be auto-populated in download prompt
	filenameForDownload := c.QueryParam("filename")
	if filenameForDownload != "" {
		contentDisposition := mime.QEncoding.Encode("utf-8", filenameForDownload)
		c.Response().Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, contentDisposition))
	}

	// 1. resolve ulid to upload cid
	if cid, err := ss.getUploadOrigCID(jobID); err == nil {
		c.Response().Header().Set("x-orig-cid", cid)
		jobID = cid
	}

	// 2. if is ba ... serve variant
	if strings.HasPrefix(jobID, "ba") {
		baCid := jobID

		var variantStoragePath string

		// parse 150x150 dimensions
		// while still allowing original.jpg
		w, h, err := parseVariantSize(variant)
		if err == nil {
			variantStoragePath = cidutil.ImageVariantPath(baCid, variant)
		} else if isOriginalJpg {
			variantStoragePath = cidutil.ShardCID(baCid)
		} else {
			return c.String(400, err.Error())
		}

		c.Response().Header().Set("x-variant-storage-path", variantStoragePath)

		// we already have this version
		if blob, err := ss.bucket.NewReader(ctx, variantStoragePath, nil); err == nil {
			return serveSuccessWithReader(blob)
		}

		// we need to generate it
		// ... get the cid
		// ... create the variant
		// ... store it at variantStoragePath
		startDynamicResize := time.Now()
		if host := ss.findNodeToServeBlob(baCid); host != "" {

			err := ss.pullFileFromHost(host, baCid)
			if err != nil {
				return err
			}

			if !isOriginalJpg {
				// dynamically create resized version
				r, err := ss.bucket.NewReader(ctx, cidutil.ShardCID(baCid), nil)
				if err != nil {
					return err
				}

				resized, _, _ := Resized(".jpg", r, w, h, "fill")
				w, _ := ss.bucket.NewWriter(ctx, variantStoragePath, nil)
				io.Copy(w, resized)
				w.Close()
				r.Close()
				c.Response().Header().Set("x-dynamic-resize-ok", fmt.Sprintf("%.2fs", time.Since(startDynamicResize).Seconds()))
			}
		} else {
			return c.String(400, fmt.Sprintf("unable to find cid: %s", baCid))
		}

		// ... serve it
		return serveSuccess(variantStoragePath)
	}

	// 3. if Qm ... serve legacy
	if cidutil.IsLegacyCID(jobID) {

		// storage path for Qm images is like:
		// QmDirMultihash/150x150.jpg
		// (no sharding)
		key := jobID + "/" + variant

		c.Response().Header().Set("x-variant-storage-path", key)

		// have it
		if blob, err := ss.bucket.NewReader(ctx, key, nil); err == nil {
			return serveSuccessWithReader(blob)
		}

		// pull blob from another host and store it at key
		// keys like QmDirMultiHash/150x150.jpg works fine with findNodeToServeBlob
		startFindNode := time.Now()
		if host := ss.findNodeToServeBlob(key); host != "" {
			err := ss.pullFileFromHost(host, key)
			if err != nil {
				return err
			}

			c.Response().Header().Set("x-find-node-success", fmt.Sprintf("%.2fs", time.Since(startFindNode).Seconds()))
			return serveSuccess(key)

		} else {
			c.Response().Header().Set("x-find-node-failure", fmt.Sprintf("%.2fs", time.Since(startFindNode).Seconds()))
		}
	}

	msg := fmt.Sprintf("variant %s not found for upload %s", variant, jobID)
	return c.String(400, msg)
}
