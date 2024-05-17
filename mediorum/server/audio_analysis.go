package server

import (
	"log"
	"runtime"
	"time"

	"github.com/AudiusProject/audius-protocol/mediorum/crudr"
	"golang.org/x/exp/slices"
)

const (
	AudioAnalysisStatusDone    = "audio_analysis_done"
	AudioAnalysisStatusTimeout = "audio_analysis_timeout"
	AudioAnalysisStatusError   = "audio_analysis_error"
)

func (ss *MediorumServer) startAudioAnalyzer() {
	myHost := ss.Config.Self.Host
	work := make(chan *Upload)

	// use most cpus
	numWorkers := runtime.NumCPU() - 2
	if numWorkers < 2 {
		numWorkers = 2
	}

	// add a callback to crudr that so we can consider audio analyses
	ss.crud.AddOpCallback(func(op *crudr.Op, records interface{}) {
		if op.Table != "uploads" || op.Action != crudr.ActionUpdate {
			return
		}

		uploads, ok := records.(*[]*Upload)
		if !ok {
			log.Printf("unexpected type in audio analysis callback %T", records)
			return
		}
		for _, upload := range *uploads {
			if upload.Status == JobStatusAudioAnalysis {
				if upload.TranscodedMirrors == nil {
					ss.logger.Warn("missing full transcoded mp3 data in audio analysis job. skipping", "id", upload.ID)
					continue
				}
				// only the first mirror transcodes
				if slices.Index(upload.TranscodedMirrors, myHost) == 0 {
					ss.logger.Info("got audio analysis job", "id", upload.ID)
					work <- upload
				}
			}
		}
	})

	// start workers
	for i := 0; i < numWorkers; i++ {
		go ss.startAudioAnalysisWorker(i, work)
	}

	// poll periodically for uploads that slipped thru the cracks.
	// mark uploads with timed out analyses as done
	for {
		time.Sleep(time.Second * 30)
		ss.findMissedJobs(work, myHost)
	}
}

func (ss *MediorumServer) findMissedJobs(work chan *Upload, myHost string) {
	uploads := []*Upload{}
	ss.crud.DB.Where("status in ?", []string{JobStatusAudioAnalysis, JobStatusBusyAudioAnalysis}).Find(&uploads)

	for _, upload := range uploads {
		mirrors := upload.Mirrors

		myIdx := slices.Index(mirrors, myHost)
		if myIdx == -1 {
			continue
		}
		myRank := myIdx + 1

		logger := ss.logger.With("upload_id", upload.ID, "upload_status", upload.Status, "my_rank", myRank)

		// allow a 1 minute timeout period for audio analysis after transcoding completes
		if time.Since(upload.TranscodedAt) > time.Minute {
			// mark analysis as timed out and the upload as done.
			// failed or timed out analyses do not block uploads.
			if upload.Status == JobStatusAudioAnalysis || upload.Status == JobStatusBusyAudioAnalysis {
				upload.AudioAnalysisStatus = AudioAnalysisStatusTimeout
				upload.Status = JobStatusDone
				ss.crud.Update(upload)
			}
		}

		// this is already handled by a callback and there's a chance this job gets enqueued twice
		if myRank == 1 && upload.Status == JobStatusAudioAnalysis {
			logger.Info("my upload audio analysis not started")
			work <- upload
			continue
		}

		// determine if #1 rank worker dropped ball
		timedOut := false
		neverStarted := false

		// for #2 rank worker:
		if myRank == 2 {
			// no recent update?
			timedOut = upload.Status == JobStatusBusyAudioAnalysis &&
				time.Since(upload.TranscodedAt) > time.Second*20

			// never started?
			neverStarted = upload.Status == JobStatusAudioAnalysis &&
				time.Since(upload.TranscodedAt) > time.Second*20
		}

		// for #3 rank worker:
		if myRank == 3 {
			// no recent update?
			timedOut = upload.Status == JobStatusBusyAudioAnalysis &&
				time.Since(upload.TranscodedAt) > time.Second*40

			// never started?
			neverStarted = upload.Status == JobStatusAudioAnalysis &&
				time.Since(upload.TranscodedAt) > time.Second*40
		}

		if timedOut {
			logger.Info("upload audio analysis timed out... starting")
			work <- upload
		} else if neverStarted {
			logger.Info("upload audio analysis never started")
			work <- upload
		}
	}
}

func (ss *MediorumServer) startAudioAnalysisWorker(n int, work chan *Upload) {
	for upload := range work {
		ss.logger.Debug("analyzing audio", "upload", upload.ID)
		err := ss.analyzeAudio(upload)
		if err != nil {
			ss.logger.Warn("audio analysis failed", "upload", upload, "err", err)
		}
	}
}

func (ss *MediorumServer) analyzeAudio(upload *Upload) error {
	upload.AudioAnalyzedBy = ss.Config.Self.Host
	upload.AudioAnalyzedAt = time.Now().UTC()
	upload.Status = JobStatusBusyAudioAnalysis
	ss.crud.Update(upload)

	onError := func(err error) error {
		upload.AudioAnalysisError = err
		upload.AudioAnalysisStatus = AudioAnalysisStatusError
		// failed analyses do not block uploads
		upload.Status = JobStatusDone
		ss.crud.Update(upload)
		return err
	}

	// TODO audio analysis
	// 1. pull transcoded file from bucket
	// 2. run through python script
	// 3. save results in upload.AudioAnalysisResults

	// success
	upload.AudioAnalyzedAt = time.Now().UTC()
	upload.AudioAnalysisStatus = AudioAnalysisStatusDone
	upload.Status = JobStatusDone
	ss.crud.Update(upload)
	return nil
}
