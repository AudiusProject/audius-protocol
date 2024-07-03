package server

import (
	"github.com/labstack/echo/v4"
)

// triggers audio analysis on an upload if a previous analysis failed or never ran.
// does nothing and returns the analysis results if analysis previously succeeded.
func (ss *MediorumServer) analyzeUpload(c echo.Context) error {
	var upload *Upload
	err := ss.crud.DB.First(&upload, "id = ?", c.Param("id")).Error
	if err != nil {
		return echo.NewHTTPError(404, err.Error())
	}

	// if upload.Template == "audio" && upload.Status == JobStatusDone && upload.AudioAnalysisStatus != JobStatusDone {
	// 	upload.AudioAnalyzedAt = time.Now().UTC()
	// 	upload.AudioAnalysisStatus = ""
	// 	upload.AudioAnalysisError = ""
	// 	upload.Status = JobStatusAudioAnalysis
	// 	err = ss.crud.Update(upload)
	// 	if err != nil {
	// 		ss.logger.Warn("update upload failed", "err", err)
	// 		return c.String(500, "failed to trigger audio analysis")
	// 	}
	// }

	return c.JSON(200, upload)
}

func (ss *MediorumServer) serveLegacyBlobAnalysis(c echo.Context) error {
	cid := c.Param("cid")
	var analysis *QmAudioAnalysis
	err := ss.crud.DB.First(&analysis, "cid = ?", cid).Error
	if err != nil {
		return echo.NewHTTPError(404, err.Error())
	}
	return c.JSON(200, analysis)
}
