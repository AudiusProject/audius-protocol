package server

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/AudiusProject/audius-protocol/mediorum/cidutil"
	"github.com/AudiusProject/audius-protocol/mediorum/crudr"
	"gocloud.dev/gcerrors"
	"golang.org/x/exp/slices"
)

func (ss *MediorumServer) startLegacyAudioAnalyzer() {
	myHost := ss.Config.Self.Host
	work := make(chan *QmAudioAnalysis)

	// use most cpus
	numWorkers := runtime.NumCPU() - 2
	if numWorkers < 2 {
		numWorkers = 2
	}

	// on boot... reset any of my wip jobs
	tx := ss.crud.DB.Model(QmAudioAnalysis{}).
		Where(QmAudioAnalysis{
			AnalyzedBy: myHost,
			Status:     JobStatusBusyAudioAnalysis,
		}).
		Updates(QmAudioAnalysis{Status: JobStatusAudioAnalysis})
	if tx.Error != nil {
		ss.logger.Warn("reset stuck legacy audio analyses error" + tx.Error.Error())
	} else if tx.RowsAffected > 0 {
		ss.logger.Info("reset stuck legacy audio analyses", "count", tx.RowsAffected)
	}

	// add a callback to crudr so we can consider audio analyses
	ss.crud.AddOpCallback(func(op *crudr.Op, records interface{}) {
		if op.Table != "qm_audio_analyses" {
			return
		}

		analyses, ok := records.(*[]*QmAudioAnalysis)
		if !ok {
			log.Printf("unexpected type in legacy audio analysis callback %T", records)
			return
		}
		for _, analysis := range *analyses {
			if analysis.Status == JobStatusAudioAnalysis {
				if analysis.Mirrors == nil {
					ss.logger.Warn("missing preferred host info in legacy audio analysis job. skipping", "analysis_cid", analysis.CID)
					continue
				}
				// only the first mirror transcodes
				if slices.Index(analysis.Mirrors, myHost) == 0 {
					ss.logger.Info("got legacy audio analysis job", "analysis_cid", analysis.CID)
					work <- analysis
				}
			}
		}
	})

	// start workers
	for i := 0; i < numWorkers; i++ {
		go ss.startLegacyAudioAnalysisWorker(i, work)
	}

	// poll periodically for analyses that slipped thru the cracks
	for {
		time.Sleep(time.Second * 30)
		ss.findMissedLegacyAnalysisJobs(work, myHost)
	}
}

// do not bother setting a timeout like in findMissedAnalysisJobs. this is not triggered
// by the client during the upload flow so it can afford to take > 1 minute
func (ss *MediorumServer) findMissedLegacyAnalysisJobs(work chan *QmAudioAnalysis, myHost string) {
	analyses := []*QmAudioAnalysis{}
	ss.crud.DB.Where("status in ?", []string{JobStatusAudioAnalysis, JobStatusBusyAudioAnalysis}).Find(&analyses)

	for _, analysis := range analyses {
		myIdx := slices.Index(analysis.Mirrors, myHost)
		if myIdx == -1 {
			continue
		}
		myRank := myIdx + 1

		logger := ss.logger.With("analysis_cid", analysis.CID, "analysis_status", analysis.Status, "my_rank", myRank)

		// mark job as timed out after 45 mins.
		// AnalyzedAt is set by the /tracks/legacy/:cid/analyze endpoint when triggering an analysis.
		if time.Since(analysis.AnalyzedAt) > time.Minute*45 {
			// mark analysis as timed out and the upload as done.
			// failed or timed out analyses do not block uploads.
			ss.logger.Warn("legacy audio analysis timed out", "analysis_cid", analysis.CID, "analysis", analysis)

			analysis.Status = JobStatusTimeout
			ss.crud.Update(analysis)
			continue
		}

		// this is already handled by a callback and there's a chance this job gets enqueued twice
		if myRank == 1 && analysis.Status == JobStatusAudioAnalysis {
			logger.Info("my legacy cid's audio analysis not started")
			work <- analysis
			continue
		}

		// determine if #1 rank worker dropped ball
		timedOut := false
		neverStarted := false

		// for #2 rank worker:
		if myRank == 2 {
			// no recent update?
			timedOut = analysis.Status == JobStatusBusyAudioAnalysis &&
				time.Since(analysis.AnalyzedAt) > time.Minute*3

			// never started?
			neverStarted = analysis.Status == JobStatusAudioAnalysis &&
				time.Since(analysis.AnalyzedAt) > time.Minute*6
		}

		// for #3 rank worker:
		if myRank == 3 {
			// no recent update?
			timedOut = analysis.Status == JobStatusBusyAudioAnalysis &&
				time.Since(analysis.AnalyzedAt) > time.Minute*7

			// never started?
			neverStarted = analysis.Status == JobStatusAudioAnalysis &&
				time.Since(analysis.AnalyzedAt) > time.Minute*14
		}

		// for #4 rank worker:
		if myRank == 4 {
			// no recent update?
			timedOut = analysis.Status == JobStatusBusyAudioAnalysis &&
				time.Since(analysis.AnalyzedAt) > time.Minute*15

			// never started?
			neverStarted = analysis.Status == JobStatusAudioAnalysis &&
				time.Since(analysis.AnalyzedAt) > time.Minute*30
		}

		if timedOut {
			logger.Info("legacy audio analysis timed out... starting")
			work <- analysis
		} else if neverStarted {
			logger.Info("legacy audio analysis never started")
			work <- analysis
		}
	}
}

func (ss *MediorumServer) startLegacyAudioAnalysisWorker(n int, work chan *QmAudioAnalysis) {
	for analysis := range work {
		logger := ss.logger.With("analysis_cid", analysis.CID)
		logger.Debug("analyzing legacy audio")
		startTime := time.Now().UTC()
		err := ss.analyzeLegacyAudio(analysis)
		elapsedTime := time.Since(startTime)
		logger = logger.With("duration", elapsedTime, "start_time", startTime)

		if err != nil {
			logger.Warn("legacy audio analysis failed", "err", err)
		} else {
			logger.Info("legacy audio analysis done")
		}
	}
}

func (ss *MediorumServer) analyzeLegacyAudio(analysis *QmAudioAnalysis) error {
	analysis.AnalyzedBy = ss.Config.Self.Host
	analysis.Status = JobStatusBusyAudioAnalysis
	ss.crud.Update(analysis)
	ctx := context.Background()

	onError := func(err error) error {
		analysis.Error = err.Error()
		analysis.ErrorCount = analysis.ErrorCount + 1
		analysis.AnalyzedAt = time.Now().UTC()
		analysis.Status = JobStatusError
		ss.crud.Update(analysis)
		return err
	}

	logger := ss.logger.With("analysis_cid", analysis.CID)

	myIdx := slices.Index(analysis.Mirrors, ss.Config.Self.Host)
	myRank := myIdx + 1

	// pull file from bucket

	// as long as this is not the last mirror, do not mark the audio analysis job
	// as failed if this node cannot pull the file from its bucket
	// so that the next mirror may pick the job up
	key := cidutil.ShardCID(analysis.CID)
	attrs, err := ss.bucket.Attributes(ctx, key)
	if err != nil {
		if gcerrors.Code(err) == gcerrors.NotFound {
			err = errors.New("failed to find legacy audio file on node")
			if myRank == len(analysis.Mirrors) {
				// mark job as failed if the job has reached the last mirror
				return onError(err)
			}
			return err
		} else {
			if myRank == len(analysis.Mirrors) {
				// mark job as failed if the job has reached the last mirror
				return onError(err)
			}
			return err
		}
	}
	// blob must be an audio file
	if !strings.HasPrefix(attrs.ContentType, "audio") {
		return onError(fmt.Errorf("blob is not an audio file"))
	}
	temp, err := os.CreateTemp("", "legacyAudioAnalysisTemp")
	if err != nil {
		logger.Error("failed to create temp file", "err", err)
		if myRank == len(analysis.Mirrors) {
			// mark job as failed if the job has reached the last mirror
			return onError(err)
		}
		return err
	}
	r, err := ss.bucket.NewReader(ctx, key, nil)
	if err != nil {
		logger.Error("failed to read blob", "err", err)
		if myRank == len(analysis.Mirrors) {
			// mark job as failed if the job has reached the last mirror
			return onError(err)
		}
		return err
	}
	defer r.Close()
	_, err = io.Copy(temp, r)
	if err != nil {
		logger.Error("failed to read blob content", "err", err)
		if myRank == len(analysis.Mirrors) {
			// mark job as failed if the job has reached the last mirror
			return onError(err)
		}
		return err
	}
	temp.Sync()
	defer temp.Close()
	defer os.Remove(temp.Name())

	// convert the file to WAV for audio processing
	wavFile := temp.Name()
	// should always be audio/mpeg after transcoding
	if attrs.ContentType == "audio/mpeg" {
		inputFile := temp.Name()
		wavFile = temp.Name() + ".wav"
		defer os.Remove(wavFile)
		err = convertToWav(inputFile, wavFile)
		if err != nil {
			logger.Error("failed to convert MP3 to WAV", "err", err)
			return onError(fmt.Errorf("failed to convert MP3 to WAV: %w", err))
		}
	}

	bpmChan := make(chan float64)
	keyChan := make(chan string)
	errorChan := make(chan error)

	// goroutine to analyze BPM
	go func() {
		bpm, err := ss.analyzeBPM(wavFile)
		if err != nil {
			logger.Error("failed to analyze BPM", "err", err)
			errorChan <- fmt.Errorf("failed to analyze BPM: %w", err)
			return
		}
		bpmChan <- bpm
	}()

	// goroutine to analyze musical key
	go func() {
		musicalKey, err := ss.analyzeKey(wavFile)
		if err != nil {
			logger.Error("failed to analyze key", "err", err)
			errorChan <- fmt.Errorf("failed to analyze key: %w", err)
			return
		}
		if musicalKey == "" || musicalKey == "Unknown" {
			err := fmt.Errorf("unexpected output: %s", musicalKey)
			logger.Error("failed to analyze key", "err", err)
			errorChan <- fmt.Errorf("failed to analyze key: %w", err)
			return
		}
		keyChan <- musicalKey
	}()

	var mu sync.Mutex

	for i := 0; i < 2; i++ {
		select {
		case bpm := <-bpmChan:
			mu.Lock()
			if analysis.Results == nil {
				analysis.Results = &AudioAnalysisResult{}
			}
			analysis.Results.BPM = bpm
			mu.Unlock()
		case musicalKey := <-keyChan:
			mu.Lock()
			if analysis.Results == nil {
				analysis.Results = &AudioAnalysisResult{}
			}
			analysis.Results.Key = musicalKey
			mu.Unlock()
		case err := <-errorChan:
			return onError(err)
		}
	}

	// all analyses complete
	analysis.Error = ""
	analysis.AnalyzedAt = time.Now().UTC()
	analysis.Status = JobStatusDone
	ss.crud.Update(analysis)

	return nil
}
