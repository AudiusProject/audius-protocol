package server

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
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
	"golang.org/x/exp/slices"
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

func (uc *UploadsCache) Get(jobId, variant string) (cid string, hasVariant bool) {
	uc.mu.RLock()
	defer uc.mu.RUnlock()
	if !uc.isBuilt {
		return
	}

	if compressedResults, ok := uc.jobIdToVariants[jobId]; ok {
		if cid, ok = compressedResults[variant]; ok {
			if strings.HasPrefix(cid, string(uc.compressedChar)) {
				cid = uc.prefix + cid[len(uc.compressedChar):]
			}
			hasVariant = true
		}
	}

	return
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
	if !ss.shouldReplicate() {
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
	if !ss.shouldReplicate() {
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
	wg := sync.WaitGroup{}
	wg.Add(len(files))
	for idx, formFile := range files {

		idx := idx
		formFile := formFile
		go func() {
			defer wg.Done()

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

// TODO: remove after confirming files didn't start go missing
func (ss *MediorumServer) getBlobByJobIDAndVariantDeprecated(c echo.Context) error {
	jobID := c.Param("jobID")
	variant := c.Param("variant")
	c.SetParamNames("dirCid", "fileName")
	c.SetParamValues(jobID, variant)
	return ss.serveLegacyDirCid(c)
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
	if cidutil.IsLegacyCID(jobID) {
		// check if file is migrated first - it would have a single key and no upload object in the db
		key := jobID + "/" + variant
		startMigratedExists := time.Now()
		exists, err := ss.bucket.Exists(c.Request().Context(), key)
		c.Response().Header().Set("x-migrated-exists", fmt.Sprintf("%.2fs", time.Since(startMigratedExists).Seconds()))
		if err != nil {
			ss.logger.Warn("migrated blob exists check failed", "err", err)
		} else if exists {
			blob, err := ss.bucket.NewReader(c.Request().Context(), key, nil)
			if err != nil {
				return err
			}
			defer blob.Close()

			http.ServeContent(c.Response(), c.Request(), key, blob.ModTime(), blob)
			return nil
		}

		// check if file is migrated but on another host
		startFindNode := time.Now()
		host, err := ss.findNodeToServeBlob(key)
		if err != nil {
			c.Response().Header().Set("x-find-node-err", fmt.Sprintf("%.2fs", time.Since(startFindNode).Seconds()))
			return err
		} else if host != "" {
			c.Response().Header().Set("x-find-node-success", fmt.Sprintf("%.2fs", time.Since(startFindNode).Seconds()))
			dest := ss.replaceHost(c, host)
			query := dest.Query()
			query.Add("allow_unhealthy", "true") // we confirmed the node has it, so allow it to serve it even if unhealthy
			dest.RawQuery = query.Encode()
			return c.Redirect(302, dest.String())
		} else {
			c.Response().Header().Set("x-find-node-not-found", fmt.Sprintf("%.2fs", time.Since(startFindNode).Seconds()))
			return c.String(404, fmt.Sprintf("no host found for %s/%s", jobID, variant))
		}
	} else {
		// TODO: remove cache once metadata has only CIDs and no jobIds/variants, so then we won't need a db lookup
		startCache := time.Now()
		cid, ok := uploadsCache.Get(jobID, variant)

		if !ok {
			c.Response().Header().Set("x-cache-miss", fmt.Sprintf("%.2fs", time.Since(startCache).Seconds()))
			startDb := time.Now()
			var upload *Upload
			err := ss.crud.DB.First(&upload, "id = ?", jobID).Error
			if err != nil {
				return err
			}
			cid, ok = upload.TranscodeResults[variant]
			if !ok {
				c.Response().Header().Set("x-db-miss", fmt.Sprintf("%.2fs", time.Since(startDb).Seconds()))

				// since cultur3stake nodes can't talk to each other
				// they might not get Upload crudr updates from each other
				// so if one cultur3stake does transcode... sibiling might not get the updates
				// so if this Upload doesn't have this variant... see if we can find a 200 from a different node
				// TODO: crudr should gossip
				if localOnly, _ := strconv.ParseBool(c.QueryParam("localOnly")); !localOnly {
					healthyHosts := ss.findHealthyPeers(2 * time.Minute)
					dest := ss.raceIsUrl2xx(*c.Request().URL, healthyHosts)
					if dest != "" {
						return c.Redirect(302, dest)
					}

					// try redirecting to unhealthy host as a last resort
					unhealthyHosts := []string{}
					for _, peer := range ss.Config.Peers {
						if peer.Host != ss.Config.Self.Host && !slices.Contains(healthyHosts, peer.Host) {
							unhealthyHosts = append(unhealthyHosts, peer.Host)
						}
					}
					dest = ss.raceIsUrl2xx(*c.Request().URL, unhealthyHosts)
					if dest != "" {
						return c.Redirect(302, dest)
					}
				}

				msg := fmt.Sprintf("variant %s not found for upload %s", variant, jobID)
				return c.String(400, msg)
			} else {
				c.Response().Header().Set("x-db-hit", fmt.Sprintf("%.2fs %s", time.Since(startDb).Seconds(), cid))
			}
		} else {
			c.Response().Header().Set("x-cache-hit", fmt.Sprintf("%.2fs %s", time.Since(startCache).Seconds(), cid))
		}

		c.SetParamNames("cid")
		c.SetParamValues(cid)
		return ss.getBlob(c)
	}
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
