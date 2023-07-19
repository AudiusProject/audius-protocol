package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mediorum/server/signature"
	"mime"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"gocloud.dev/gcerrors"
	"golang.org/x/exp/slices"
)

func (ss *MediorumServer) getBlobLocation(c echo.Context) error {
	cid := c.Param("cid")
	locations := []Blob{}
	ss.crud.DB.Where(Blob{Key: cid}).Find(&locations)
	preferred, _ := ss.rendezvous(cid)
	return c.JSON(200, map[string]any{
		"cid":       cid,
		"locations": locations,
		"preferred": preferred,
	})
}

func (ss *MediorumServer) getBlobProblems(c echo.Context) error {
	problems, err := ss.findProblemBlobs(false)
	if err != nil {
		return err
	}
	return c.JSON(200, problems)
}

func (ss *MediorumServer) getBlobBroken(c echo.Context) error {
	ctx := c.Request().Context()
	problems, err := ss.findProblemBlobs(false)
	if err != nil {
		return err
	}
	results := map[string]string{}
	for _, problem := range problems {
		_, isMine := ss.rendezvous(problem.Key)
		if !isMine {
			continue
		}
		r, err := ss.bucket.NewReader(ctx, problem.Key, nil)
		if err != nil {
			results[problem.Key] = err.Error()
			continue
		}
		defer r.Close()
		cid, err := computeFileCID(r)
		if err != nil {
			results[problem.Key] = err.Error()
			continue
		}
		if cid != problem.Key {
			results[problem.Key] = fmt.Sprintf("computed cid %s", cid)
		}
	}
	return c.JSON(200, results)
}

func (ss *MediorumServer) getBlobInfo(c echo.Context) error {
	ctx := c.Request().Context()
	key := c.Param("cid")
	attr, err := ss.bucket.Attributes(ctx, key)
	if err != nil {
		if gcerrors.Code(err) == gcerrors.NotFound {
			return c.String(404, "blob not found")
		}
		ss.logger.Warn("error getting blob attributes", "error", err)
		return err
	}

	// since this is called before redirecting, make sure this node can actually serve the blob (it needs to check db for delisted status)
	dbHealthy := ss.databaseSize > 0
	if !dbHealthy {
		return c.String(500, "database connection issue")
	}

	return c.JSON(200, attr)
}

// similar to blob info... but more complete
func (ss *MediorumServer) getBlobDoubleCheck(c echo.Context) error {
	ctx := c.Request().Context()
	key := c.Param("cid")

	r, err := ss.bucket.NewReader(ctx, key, nil)
	if err != nil {
		// Check if the error is a blob not found error
		// If it is, return a 404
		if strings.Contains(err.Error(), "not found") {
			return c.String(404, "blob not found")
		}
		return err
	}
	defer r.Close()

	// verify CID matches
	err = validateCID(key, r)
	if err != nil {
		return err
	}

	// verify DB row exists
	var existingBlob *Blob
	err = ss.crud.DB.Where("host = ? AND key = ?", ss.Config.Self.Host, key).First(&existingBlob).Error
	if err != nil {
		return err
	}

	return c.JSON(200, existingBlob)
}

func (ss *MediorumServer) ensureNotDelisted(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		ctx := c.Request().Context()
		key := c.Param("cid")

		if ss.isCidBlacklisted(ctx, key) {
			ss.logger.Info("cid is blacklisted", "cid", key)
			return c.String(403, "cid is blacklisted by this node")
		}

		c.Set("checkedDelistStatus", true)
		return next(c)
	}
}

func (ss *MediorumServer) getBlob(c echo.Context) error {
	ctx := c.Request().Context()
	key := c.Param("cid")
	logger := ss.logger.With("cid", key)

	shouldCheckDelistStatus := true
	if checkedDelistStatus, exists := c.Get("checkedDelistStatus").(bool); exists && checkedDelistStatus {
		shouldCheckDelistStatus = false
	}
	if shouldCheckDelistStatus && ss.isCidBlacklisted(ctx, key) {
		logger.Info("cid is blacklisted")
		return c.String(403, "cid is blacklisted by this node")
	}

	// if the client provided a filename, set it in the header to be auto-populated in download prompt
	filenameForDownload := c.QueryParam("filename")
	if filenameForDownload != "" {
		contentDisposition := mime.QEncoding.Encode("utf-8", filenameForDownload)
		c.Response().Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, contentDisposition))
	}

	if isLegacyCID(key) {
		logger.Debug("serving legacy cid")
		return ss.serveLegacyCid(c)
	}

	if attrs, err := ss.bucket.Attributes(ctx, key); err == nil && attrs != nil {
		isAudioFile := strings.HasPrefix(attrs.ContentType, "audio")
		// detect mime type and block mp3 streaming outside of the /tracks/cidstream route
		if !strings.Contains(c.Path(), "cidstream") && isAudioFile {
			return c.String(401, "mp3 streaming is blocked. Please use Discovery /v1/tracks/:encodedId/stream")
		}

		blob, err := ss.bucket.NewReader(ctx, key, nil)
		if err != nil {
			return err
		}
		defer blob.Close()

		// v2 file listen
		if isAudioFile {
			go ss.logTrackListen(c)
		}

		if c.Request().Method == "HEAD" {
			return c.NoContent(200)
		}

		http.ServeContent(c.Response(), c.Request(), key, blob.ModTime(), blob)
		return nil
	}

	// redirect to it
	var blobs []Blob
	healthyHosts := ss.findHealthyPeers(2 * time.Minute)
	err := ss.crud.DB.
		Where("key = ? and host in ?", key, healthyHosts).
		Find(&blobs).Error
	if err != nil {
		return err
	}
	for _, blob := range blobs {
		// do a check server is up and has blob
		if ss.hostHasBlob(blob.Host, key) {
			dest := ss.replaceHost(c, blob.Host)
			return c.Redirect(302, dest.String())
		}
	}

	return c.String(404, "blob not found")
}

func (ss *MediorumServer) logTrackListen(c echo.Context) {

	skipPlayCount := strings.ToLower(c.QueryParam("skip_play_count")) == "true"

	if skipPlayCount ||
		os.Getenv("identityService") == "" ||
		!rangeIsFirstByte(c.Request().Header.Get("Range")) ||
		c.Request().Method != "GET" {
		// todo: skip count for trusted notifier requests should be inferred
		// by the requesting entity and not some query param
		return
	}

	httpClient := http.Client{
		Timeout: 5 * time.Second, // identity svc slow
	}

	sig, err := signature.ParseFromQueryString(c.QueryParam("signature"))
	if err != nil {
		ss.logger.Warn("unable to parse signature for request", "signature", c.QueryParam("signature"), "remote_addr", c.Request().RemoteAddr, "url", c.Request().URL)
		return
	}

	// as per CN `userId: req.userId ?? delegateOwnerWallet`
	userId := ss.Config.Self.Wallet
	if sig.Data.UserID != 0 {
		userId = strconv.Itoa(sig.Data.UserID)
	}

	endpoint := fmt.Sprintf("%s/tracks/%d/listen", os.Getenv("identityService"), sig.Data.TrackId)
	signatureData, err := signature.GenerateListenTimestampAndSignature(ss.Config.privateKey)
	if err != nil {
		ss.logger.Error("unable to build request", "err", err)
		return
	}

	body := map[string]interface{}{
		"userId":       userId,
		"solanaListen": false,
		"timestamp":    signatureData.Timestamp,
		"signature":    signatureData.Signature,
	}

	buf, err := json.Marshal(body)
	if err != nil {
		ss.logger.Error("unable to build request", "err", err)
		return
	}

	req, err := http.NewRequest("POST", endpoint, bytes.NewReader(buf))
	if err != nil {
		ss.logger.Error("unable to build request", "err", err)
		return
	}
	req.Header.Set("content-type", "application/json")
	req.Header.Add("x-forwarded-for", c.RealIP())
	req.Header.Set("User-Agent", "mediorum "+ss.Config.Self.Host)

	res, err := httpClient.Do(req)
	if err != nil {
		ss.logger.Error("unable to POST to identity service", "err", err)
		return
	}
	defer res.Body.Close()

	if res.StatusCode != 200 {
		resBody, err := io.ReadAll(res.Body)
		if err != nil {
			ss.logger.Warn(fmt.Sprintf("unsuccessful POST [%d] %s", res.StatusCode, resBody))
		}
	}
}

// checks signature from discovery node for cidstream endpoint + premium content.
// based on: https://github.com/AudiusProject/audius-protocol/blob/main/creator-node/src/middlewares/contentAccess/contentAccessMiddleware.ts
func (s *MediorumServer) requireRegisteredSignature(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		cid := c.Param("cid")
		sig, err := signature.ParseFromQueryString(c.QueryParam("signature"))
		if err != nil {
			return c.JSON(401, map[string]string{
				"error":  "invalid signature",
				"detail": err.Error(),
			})
		} else {
			// check it was signed by a registered node
			isRegistered := slices.ContainsFunc(s.Config.Signers, func(peer Peer) bool {
				return strings.EqualFold(peer.Wallet, sig.SignerWallet)
			})
			if !isRegistered {
				s.logger.Info("sig no match", "signed by", sig.SignerWallet)
				return c.JSON(401, map[string]string{
					"error":  "signer not in list of registered nodes",
					"detail": "signed by: " + sig.SignerWallet,
				})
			}

			// check signature not too old
			age := time.Since(time.Unix(sig.Data.Timestamp/1000, 0))
			if age > (time.Hour * 48) {
				return c.JSON(401, map[string]string{
					"error":  "signature too old",
					"detail": age.String(),
				})
			}

			// check it is for this cid
			if sig.Data.Cid != cid {
				return c.JSON(401, map[string]string{
					"error":  "signature contains incorrect CID",
					"detail": fmt.Sprintf("url: %s, signature %s", cid, sig.Data.Cid),
				})
			}

			// OK
			c.Response().Header().Set("x-signature-debug", sig.String())
		}

		return next(c)
	}
}

func (ss *MediorumServer) serveInternalBlobPull(c echo.Context) error {
	ctx := c.Request().Context()
	key := c.Param("cid")

	blob, err := ss.bucket.NewReader(ctx, key, nil)
	if err != nil {
		return err
	}
	defer blob.Close()

	return c.Stream(200, blob.ContentType(), blob)
}

func (ss *MediorumServer) postBlob(c echo.Context) error {
	form, err := c.MultipartForm()
	if err != nil {
		return err
	}
	files := form.File[filesFormFieldName]
	defer form.RemoveAll()

	for _, upload := range files {
		cid := upload.Filename
		logger := ss.logger.With("cid", cid)

		inp, err := upload.Open()
		if err != nil {
			return err
		}
		defer inp.Close()

		err = validateCID(cid, inp)
		if err != nil {
			logger.Info("postBlob got invalid CID", "err", err)
			return c.JSON(400, map[string]string{
				"error": err.Error(),
			})
		}

		err = ss.replicateToMyBucket(cid, inp)
		if err != nil {
			ss.logger.Info("accept ERR", "err", err)
			return err
		}
	}

	return c.JSON(200, "ok")
}
