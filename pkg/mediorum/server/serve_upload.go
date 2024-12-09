package server

import (
	"database/sql"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/mediorum/cidutil"
	"github.com/AudiusProject/audius-protocol/pkg/mediorum/server/signature"

	"github.com/labstack/echo/v4"
	"github.com/oklog/ulid/v2"
	"golang.org/x/exp/slices"
	"golang.org/x/sync/errgroup"
)

var (
	filesFormFieldName = "files"
)

func (ss *MediorumServer) serveUploadDetail(c echo.Context) error {
	var upload *Upload
	err := ss.crud.DB.First(&upload, "id = ?", c.Param("id")).Error
	if err != nil {
		return echo.NewHTTPError(404, err.Error())
	}
	if upload.Status == JobStatusError {
		return c.JSON(422, upload)
	}

	if fix, _ := strconv.ParseBool(c.QueryParam("fix")); fix && upload.Status != JobStatusDone {
		err = ss.transcode(upload)
		if err != nil {
			return err
		}
	}

	if analyze, _ := strconv.ParseBool(c.QueryParam("analyze")); analyze && upload.AudioAnalysisStatus != "done" {
		err = ss.analyzeAudio(upload, time.Minute*10)
		if err != nil {
			return err
		}
	}

	return c.JSON(200, upload)
}

func (ss *MediorumServer) serveUploadList(c echo.Context) error {
	afterCursor, _ := time.Parse(time.RFC3339Nano, c.QueryParam("after"))
	var uploads []Upload
	err := ss.crud.DB.
		Where("created_at > ?", afterCursor).
		Order(`created_at`).Limit(2000).Find(&uploads).Error
	if err != nil {
		return err
	}
	return c.JSON(200, uploads)
}

type UpdateUploadBody struct {
	PreviewStartSeconds string `json:"previewStartSeconds"`
}

// generatePreview endpoint will create a new 30s preview mp3
// save the cid to the audio_previews table
// and return to the client.
func (ss *MediorumServer) generatePreview(c echo.Context) error {
	ctx := c.Request().Context()
	fileHash := c.Param("cid")
	previewStartSeconds := c.Param("previewStartSeconds")

	audioPreview, err := ss.generateAudioPreview(ctx, fileHash, previewStartSeconds)
	if err != nil {
		return err
	}

	return c.JSON(200, audioPreview)
}

// this endpoint should be replaced by generate_preview
// when client is fully using generate_preview
// this can be removed.
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
		err := ss.generateAudioPreviewForUpload(upload)
		if err != nil {
			return err
		}
	}

	return c.JSON(200, upload)
}

func (ss *MediorumServer) postUpload(c echo.Context) error {
	if !ss.diskHasSpace() {
		ss.logger.Warn("disk is too full to accept new uploads")
		return c.String(http.StatusServiceUnavailable, "disk is too full to accept new uploads")
	}

	// read user wallet from ?signature query string
	// ... fall back to (legacy) X-User-Wallet header
	userWallet := sql.NullString{Valid: false}

	// updateUpload uses the requireUserSignature c.Get("signer-wallet")
	// but requireUserSignature will fail request if missing
	// so parse direclty here
	if sig, err := signature.ParseFromQueryString(c.QueryParam("signature")); err == nil {
		userWallet = sql.NullString{
			String: sig.SignerWallet,
			Valid:  true,
		}
	} else {
		userWalletHeader := c.Request().Header.Get("X-User-Wallet-Addr")
		if userWalletHeader != "" {
			userWallet = sql.NullString{
				String: userWalletHeader,
				Valid:  true,
			}
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

	if err := validateJobTemplate(template); err != nil {
		return c.String(400, err.Error())
	}

	var placementHosts []string = nil
	if v := c.FormValue("placement_hosts"); v != "" {
		placementHosts = strings.Split(v, ",")
	}

	if placementHosts != nil {
		if !slices.Contains(placementHosts, ss.Config.Self.Host) {
			return c.String(400, "if placement_hosts is specified, you must upload to one of the placement_hosts")
		}
		// validate that the placement hosts are all registered nodes
		for _, host := range placementHosts {
			isRegistered := false
			for _, peer := range ss.Config.Peers {
				if peer.Host == host {
					isRegistered = true
					break
				}
			}
			if !isRegistered {
				return c.String(400, "all placement_hosts must be registered signers")
			}
		}
	}

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
				PlacementHosts:   placementHosts,
			}
			uploads[idx] = upload

			tmpFile, err := copyUploadToTempFile(formFile)
			if err != nil {
				upload.Error = err.Error()
				return err
			}
			defer os.Remove(tmpFile.Name())

			formFileCID, err := cidutil.ComputeFileCID(tmpFile)
			if err != nil {
				upload.Error = err.Error()
				return err
			}

			upload.OrigFileCID = formFileCID

			// ffprobe:
			upload.FFProbe, err = ffprobe(tmpFile.Name())
			if err != nil {
				// fail upload if ffprobe fails
				upload.Error = err.Error()
				return c.String(400, err.Error())
			}

			// ffprobe: restore orig filename
			upload.FFProbe.Format.Filename = formFile.Filename

			// replicate to my bucket + others
			ss.replicateToMyBucket(formFileCID, tmpFile)
			upload.Mirrors, err = ss.replicateFileParallel(formFileCID, tmpFile.Name(), placementHosts)
			if err != nil {
				upload.Error = err.Error()
				return err
			}

			ss.logger.Info("mirrored", "name", formFile.Filename, "uploadID", upload.ID, "cid", formFileCID, "mirrors", upload.Mirrors)

			if template == JobTemplateImgSquare || template == JobTemplateImgBackdrop {
				upload.TranscodeResults["original.jpg"] = formFileCID
				upload.TranscodeProgress = 1
				upload.TranscodedAt = time.Now().UTC()
				upload.Status = JobStatusDone
				return ss.crud.Create(upload)
			}

			ss.crud.Create(upload)
			ss.transcodeWork <- upload
			return nil
		})
	}

	status := 200
	if err := wg.Wait(); err != nil {
		ss.logger.Error("failed to process new upload", "err", err)
		status = 422
	}

	return c.JSON(status, uploads)
}

func copyUploadToTempFile(file *multipart.FileHeader) (*os.File, error) {
	temp, err := os.CreateTemp("", "mediorumUpload")
	if err != nil {
		return nil, err
	}

	r, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer r.Close()

	_, err = io.Copy(temp, r)
	if err != nil {
		return nil, err
	}
	temp.Sync()
	temp.Seek(0, 0)

	return temp, nil
}
