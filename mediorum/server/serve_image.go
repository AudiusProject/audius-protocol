package server

import (
	"fmt"
	"io"
	"mediorum/cidutil"
	"mime"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"gocloud.dev/blob"
)

func (ss *MediorumServer) serveImage(c echo.Context) error {
	// images are small enough to always serve all at once (no 206 range responses)
	c.Request().Header.Del("Range")

	ctx := c.Request().Context()
	jobID := c.Param("jobID")
	variant := c.Param("variant")
	isOriginalJpg := variant == "original.jpg"

	// helper function... only sets cache-control header on success
	serveSuccessWithReader := func(blob *blob.Reader) error {
		blobData, err := io.ReadAll(blob)
		if err != nil {
			return err
		}
		blob.Close()
		c.Response().Header().Set(echo.HeaderCacheControl, "public, max-age=2592000, immutable")
		return c.Blob(200, blob.ContentType(), blobData)
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

		// we already have the resized version
		if blob, err := ss.bucket.NewReader(ctx, variantStoragePath, nil); err == nil {
			return serveSuccessWithReader(blob)
		}

		// open the orig for resizing
		origReader, err := ss.bucket.NewReader(ctx, cidutil.ShardCID(baCid), nil)

		// if we don't have orig, fetch from network
		if err != nil {
			startFetch := time.Now()
			host, err := ss.findAndPullBlob(ctx, baCid)
			if err != nil {
				return c.String(404, err.Error())
			}

			c.Response().Header().Set("x-fetch-host", host)
			c.Response().Header().Set("x-fetch-ok", fmt.Sprintf("%.2fs", time.Since(startFetch).Seconds()))

			origReader, err = ss.bucket.NewReader(ctx, cidutil.ShardCID(baCid), nil)
			if err != nil {
				return err
			}
		}

		// do resize if not original.jpg
		if !isOriginalJpg {
			resizeStart := time.Now()
			resized, _, _ := Resized(".jpg", origReader, w, h, "fill")
			w, _ := ss.bucket.NewWriter(ctx, variantStoragePath, nil)
			io.Copy(w, resized)
			w.Close()
			c.Response().Header().Set("x-resize-ok", fmt.Sprintf("%.2fs", time.Since(resizeStart).Seconds()))
		}
		origReader.Close()

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
		startFetch := time.Now()
		host, err := ss.findAndPullBlob(ctx, key)
		if err != nil {
			return c.String(404, err.Error())
		}

		c.Response().Header().Set("x-fetch-host", host)
		c.Response().Header().Set("x-fetch-ok", fmt.Sprintf("%.2fs", time.Since(startFetch).Seconds()))
		return serveSuccess(key)
	}

	msg := fmt.Sprintf("variant %s not found for upload %s", variant, jobID)
	return c.String(400, msg)
}
