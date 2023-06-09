package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mediorum/server/signature"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"golang.org/x/exp/slices"
)

func (ss *MediorumServer) getBlobLocation(c echo.Context) error {
	cid := c.Param("cid")
	locations := []Blob{}
	ss.crud.DB.Where(Blob{Key: cid}).Find(&locations)
	return c.JSON(200, map[string]any{
		"cid":       cid,
		"locations": locations,
		"preferred": ss.placement.topAll(cid),
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
		return err
	}
	return c.JSON(200, attr)
}

// similar to blob info... but more complete
func (ss *MediorumServer) getBlobDoubleCheck(c echo.Context) error {
	ctx := c.Request().Context()
	key := c.Param("cid")

	// verify blob exists
	r, err := ss.bucket.NewReader(ctx, key, nil)
	if err != nil {
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

func (ss *MediorumServer) getBlob(c echo.Context) error {
	ctx := c.Request().Context()
	key := c.Param("cid")

	if ss.isCidBlacklisted(ctx, key) {
		return c.String(403, "cid is blacklisted by this node")
	}

	// If the client provided a filename, set it in the header to be auto-populated in download prompt
	filenameForDownload := c.QueryParam("filename")
	if filenameForDownload != "" {
		contentDisposition := url.QueryEscape(filenameForDownload)
		c.Response().Header().Set("Content-Disposition", "attachment; filename="+contentDisposition)
	}

	if isLegacyCID(key) {
		ss.logger.Debug("serving legacy cid", "cid", key)
		return ss.serveLegacyCid(c)
	}

	if attrs, err := ss.bucket.Attributes(ctx, key); err == nil && attrs != nil {
		// detect mime type:
		// if this is not the cidstream route, we should block mp3 streaming
		// for now just set a header until we are ready to 401 (after client using cidstream everywhere)
		if !strings.Contains(c.Path(), "cidstream") && strings.HasPrefix(attrs.ContentType, "audio") {
			c.Response().Header().Set("x-would-block", "true")
		}

		blob, err := ss.bucket.NewReader(ctx, key, nil)
		if err != nil {
			return err
		}
		defer blob.Close()

		// v2 file listen
		go ss.logTrackListen(c)

		http.ServeContent(c.Response(), c.Request(), key, blob.ModTime(), blob)
		return nil
	}

	// redirect to it
	var blobs []Blob
	healthyHosts := ss.findHealthyHostNames("2 minutes")
	err := ss.crud.DB.
		Where("key = ? and host in ?", key, healthyHosts).
		Find(&blobs).Error
	if err != nil {
		return err
	}
	for _, blob := range blobs {
		// do a check server is up and has blob
		if ss.hostHasBlob(blob.Host, key, false) {
			dest := replaceHost(*c.Request().URL, blob.Host)
			return c.Redirect(302, dest.String())
		}
	}

	return c.String(404, "blob not found")
}

func (ss *MediorumServer) logTrackListen(c echo.Context) {

	skipPlayCount := strings.ToLower(c.QueryParam("skip_play_count")) == "true"

	if skipPlayCount ||
		os.Getenv("identityService") == "" ||
		!rangeIsFirstByte(c.Request().Header.Get("Range")) {
		// todo: skip count for trusted notifier requests should be inferred
		// by the requesting entity and not some query param
		return
	}

	httpClient := http.Client{
		Timeout: 5 * time.Second, // identity svc slow
	}

	sig, err := signature.ParseFromQueryString(c.QueryParam("signature"))
	if err != nil {
		ss.logger.Warn("unable to parse signature for request", "signature", c.QueryParam("signature"))
		return
	}

	endpoint := fmt.Sprintf("%s/tracks/%d/listen", os.Getenv("identityService"), sig.Data.TrackId)
	signatureData, err := signature.GenerateListenTimestampAndSignature(ss.Config.privateKey)
	if err != nil {
		ss.logger.Error("unable to build request", err)
		return
	}

	body := map[string]interface{}{
		"userId":       ss.Config.Self.Wallet, // as per CN `userId: req.userId ?? delegateOwnerWallet`
		"solanaListen": false,
		"timestamp":    signatureData.Timestamp,
		"signature":    signatureData.Signature,
	}

	buf, err := json.Marshal(body)
	if err != nil {
		ss.logger.Error("unable to build request", err)
		return
	}

	req, err := http.NewRequest("POST", endpoint, bytes.NewReader(buf))
	if err != nil {
		ss.logger.Error("unable to build request", err)
		return
	}
	req.Header.Set("content-type", "application/json")
	req.Header.Add("x-forwarded-for", c.RealIP())

	res, err := httpClient.Do(req)
	if err != nil {
		ss.logger.Error("unable to POST to identity service", err)
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
func (s *MediorumServer) requireSignature(next echo.HandlerFunc) echo.HandlerFunc {
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
			age := time.Since(time.Unix(sig.Data.Timestamp, 0))
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
