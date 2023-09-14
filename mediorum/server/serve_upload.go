package server

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"mediorum/cidutil"
	"mime"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/oklog/ulid/v2"
	"golang.org/x/sync/errgroup"
)

var (
	filesFormFieldName = "files"
	uploadsCache       *UploadsCache
)

type UploadsCache struct {
	jobIdToVariants map[string]map[string]string
	isBuilt         bool
	compressedChar  string // char to replace "baeaaaiqse" with because all CIDs we have start with this
	prefix          string // "baeaaaiqse"
	mu              *sync.RWMutex
}

func (uc *UploadsCache) Get(jobId, variant string) (string, bool) {
	uc.mu.RLock()
	defer uc.mu.RUnlock()
	if !uc.isBuilt {
		return "", false
	}

	if compressedResults, ok := uc.jobIdToVariants[jobId]; ok {
		if cid, ok := compressedResults[variant]; ok {
			if strings.HasPrefix(cid, string(uc.compressedChar)) {
				cid = uc.prefix + cid[len(uc.compressedChar):]
			}
			return cid, true
		}
	}

	return "", false
}

func (uc *UploadsCache) Set(jobId string, results map[string]string) {
	uc.mu.Lock()
	defer uc.mu.Unlock()
	compressedResults := make(map[string]string, len(results))
	for k, v := range results {
		// we only care about images
		if strings.HasPrefix(k, "320") {
			continue
		}

		if strings.HasPrefix(v, uc.prefix) {
			compressedResults[k] = uc.compressedChar + v[len(uc.prefix):]
		} else {
			compressedResults[k] = v
		}
	}
	uc.jobIdToVariants[jobId] = compressedResults
}

func createUploadsCache() {
	uploadsCache = &UploadsCache{
		jobIdToVariants: make(map[string]map[string]string),
		isBuilt:         false,
		compressedChar:  "`", // anything non-base32 will do
		prefix:          "baeaaaiqse",
		mu:              &sync.RWMutex{},
	}
}

func (ss *MediorumServer) buildUploadsCache() {
	start := time.Now()
	ctx := context.Background()

	conn, err := ss.pgPool.Acquire(ctx)
	if err != nil {
		ss.logger.Warn("error acquiring connection from pool to build uploads cache", "err", err)
		return
	}
	defer conn.Release()

	pageSize := 10000
	lastID := ""

	for {
		query := `select id, transcode_results from uploads where id > $1 order by id limit $2`
		rows, err := conn.Query(ctx, query, lastID, pageSize)
		if err != nil {
			ss.logger.Warn("error querying uploads table to build cache", "err", err)
			return
		}

		var pageEmpty = true
		for rows.Next() {
			pageEmpty = false
			var id string
			var resultsJSON []byte

			err := rows.Scan(&id, &resultsJSON)
			if err != nil {
				ss.logger.Warn("error scanning row while building uploads cache", "err", err)
				return
			}

			results := make(map[string]string)
			if err := json.Unmarshal(resultsJSON, &results); err != nil {
				ss.logger.Warn("error unmarshaling results while building uploads cache", "err", err)
				return
			}

			uploadsCache.Set(id, results)
			lastID = id
		}

		if pageEmpty {
			break
		}
	}

	uploadsCache.mu.Lock()
	uploadsCache.isBuilt = true
	uploadsCache.mu.Unlock()
	took := time.Since(start)
	ss.logger.Info("uploads cache built", "took_minutes", took.Minutes())
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
	c.Response().Header().Set(echo.HeaderCacheControl, "public, max-age=2592000, immutable")

	ctx := c.Request().Context()
	jobID := c.Param("jobID")
	variant := c.Param("variant")

	// if the client provided a filename, set it in the header to be auto-populated in download prompt
	filenameForDownload := c.QueryParam("filename")
	if filenameForDownload != "" {
		contentDisposition := mime.QEncoding.Encode("utf-8", filenameForDownload)
		c.Response().Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, contentDisposition))
	}

	// 1. resolve ulid to upload cid
	if _, err := ulid.Parse(jobID); err == nil {
		var upload Upload
		err := ss.crud.DB.First(&upload, "id = ?", jobID).Error
		if err == nil {
			// todo: cache this similar to redirectCache
			jobID = upload.OrigFileCID
		}
	}

	// 2. if is ba ... serve variant
	if strings.HasPrefix(jobID, "ba") {
		baCid := jobID
		variantStoragePath := cidutil.ImageVariantPath(baCid, variant)

		// we already have this version
		if blob, err := ss.bucket.NewReader(ctx, variantStoragePath, nil); err == nil {
			http.ServeContent(c.Response(), c.Request(), variantStoragePath, blob.ModTime(), blob)
			return blob.Close()
		}

		w, h, err := parseVariantSize(variant)
		if err != nil {
			return c.String(400, err.Error())
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
		} else {
			c.Response().Header().Set("x-dynamic-resize-failure", fmt.Sprintf("%.2fs", time.Since(startDynamicResize).Seconds()))
			return err
		}

		// ... serve it
		if blob, err := ss.bucket.NewReader(ctx, variantStoragePath, nil); err == nil {
			http.ServeContent(c.Response(), c.Request(), variantStoragePath, blob.ModTime(), blob)
			return blob.Close()
		}
	}

	// 3. if Qm ... serve legacy
	if cidutil.IsLegacyCID(jobID) {

		// storage path for Qm images is like:
		// QmDirMultihash/150x150.jpg
		// (no sharding)
		key := jobID + "/" + variant

		if blob, err := ss.bucket.NewReader(ctx, key, nil); err == nil {
			http.ServeContent(c.Response(), c.Request(), key, blob.ModTime(), blob)
			return blob.Close()
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
			if blob, err := ss.bucket.NewReader(ctx, key, nil); err == nil {
				http.ServeContent(c.Response(), c.Request(), key, blob.ModTime(), blob)
				return blob.Close()
			}

		} else {
			c.Response().Header().Set("x-find-node-failure", fmt.Sprintf("%.2fs", time.Since(startFindNode).Seconds()))
		}
	}

	msg := fmt.Sprintf("variant %s not found for upload %s", variant, jobID)
	return c.String(400, msg)
}

// raceIsUrl200 tries batches of 5 hosts concurrently to find the first healthy host that returns a 200 instead of sequentially waiting for a 2s timeout from each host.
func (ss *MediorumServer) raceIsUrl2xx(url url.URL, hostsToRace []string) string {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	g, _ := errgroup.WithContext(ctx)
	g.SetLimit(5)
	destWith2xx := make(chan string, 1)

	for _, host := range hostsToRace {
		if host == ss.Config.Self.Host {
			continue
		}
		h := host
		g.Go(func() error {
			if dest, is2xx := ss.isUrl2xx(url, h); is2xx {
				// write to channel and cancel context to stop other goroutines, or stop if context was already canceled
				select {
				case destWith2xx <- dest:
					cancel()
				case <-ctx.Done():
				}
			}
			return nil
		})
	}

	go func() {
		g.Wait()
		close(destWith2xx)
	}()

	dest, ok := <-destWith2xx
	if ok {
		return dest
	}
	return ""
}

// isUrl200 checks if dest returns 2xx for hostString when not following redirects.
func (ss *MediorumServer) isUrl2xx(dest url.URL, hostString string) (string, bool) {
	noRedirectClient := &http.Client{
		// without this option, we'll incorrectly think Node A has it when really Node A was telling us to redirect to Node B
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
		Timeout: 2 * time.Second,
	}

	logger := ss.logger.With("redirect", "url", dest.String(), "host", hostString)

	hostUrl, err := url.Parse(hostString)
	if err != nil {
		return "", false
	}

	dest.Host = hostUrl.Host
	dest.Scheme = hostUrl.Scheme
	query := dest.Query()
	query.Add("localOnly", "true")
	dest.RawQuery = query.Encode()

	req, err := http.NewRequest("GET", dest.String(), nil)
	if err != nil {
		logger.Error("invalid url", "err", err)
		return "", false
	}
	req.Header.Set("User-Agent", "mediorum "+ss.Config.Self.Host)

	resp, err := noRedirectClient.Do(req)
	if err != nil {
		logger.Error("request failed", "err", err)
		return "", false
	}
	resp.Body.Close()
	if resp.StatusCode == 200 || resp.StatusCode == 204 || resp.StatusCode == 206 {
		return dest.String(), true
	}

	return "", false
}
