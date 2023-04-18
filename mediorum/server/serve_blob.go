package server

import (
	"mediorum/server/signature"

	"github.com/labstack/echo/v4"
)

func (ss *MediorumServer) getBlobLocation(c echo.Context) error {
	locations := []Blob{}
	ss.crud.DB.Where(Blob{Key: c.Param("cid")}).Find(&locations)
	return c.JSON(200, locations)
}

func (ss *MediorumServer) getBlobProblems(c echo.Context) error {
	problems, err := ss.findProblemBlobs(false)
	if err != nil {
		return err
	}
	return c.JSON(200, problems)
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

func (ss *MediorumServer) getBlob(c echo.Context) error {
	ctx := c.Request().Context()
	key := c.Param("cid")

	// verify signature... just print result for now
	{
		sig, err := signature.ParseFromQueryString(c.QueryParam("signature"))
		if err != nil {
			// ss.logger.Warn("invalid signautre, would reject", "err", err)
			c.Response().Header().Set("x-signature-error", err.Error())
		} else {
			// todo should check that track / timestamp all match up
			// and that signer is a discovery node
			// ss.logger.Info("parsed signature ok", "sig", sig)
			c.Response().Header().Set("x-signature", sig.String())
		}
	}

	if isLegacyCID(key) {
		ss.logger.Debug("serving legacy cid", "cid", key)
		return ss.serveLegacyCid(c)
	}

	if iHave, _ := ss.bucket.Exists(ctx, key); iHave {
		blob, err := ss.bucket.NewReader(ctx, key, nil)
		if err != nil {
			return err
		}
		defer blob.Close()
		return c.Stream(200, blob.ContentType(), blob)
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
		// double tripple check server is up and has blob
		if ss.hostHasBlob(blob.Host, key) {
			dest := replaceHost(*c.Request().URL, blob.Host)
			return c.Redirect(302, dest.String())
		}
	}

	return c.String(404, "blob not found")
}

func (ss *MediorumServer) postBlob(c echo.Context) error {
	form, err := c.MultipartForm()
	if err != nil {
		return err
	}
	files := form.File["files"]
	defer form.RemoveAll()

	for _, upload := range files {

		inp, err := upload.Open()
		if err != nil {
			return err
		}
		defer inp.Close()

		cid, err := computeFileCID(inp)
		if err != nil {
			return err
		}
		if cid != upload.Filename {
			ss.logger.Warn("postBlob CID mismatch", "filename", upload.Filename, "cid", cid)
		}

		err = ss.replicateToMyBucket(cid, inp)
		if err != nil {
			ss.logger.Info("accept ERR", "file", upload.Filename, "err", err)
		}
	}

	return c.JSON(200, "ok")
}
