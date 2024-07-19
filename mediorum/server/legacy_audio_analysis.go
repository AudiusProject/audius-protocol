package server

import (
	"context"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/AudiusProject/audius-protocol/mediorum/cidutil"
	"github.com/jackc/pgx/v5"
	"gocloud.dev/gcerrors"
)

const MAX_TRIES = 5

// scroll qm cids
func (ss *MediorumServer) startLegacyAudioAnalyzer() {
	ctx := context.Background()
	logger := ss.logger

	work := make(chan *QmAudioAnalysis)

	numWorkers := 4

	// start workers
	for i := 0; i < numWorkers; i++ {
		go ss.startLegacyAudioAnalysisWorker(i, work)
	}

	time.Sleep(time.Minute)

	// find work
	var cid string
	rows, _ := ss.pgPool.Query(ctx, "select key from qm_cids where key not like '%.jpg' order by random()")
	_, err := pgx.ForEachRow(rows, []any{&cid}, func() error {

		if strings.HasSuffix(cid, ".jpg") {
			return nil
		}

		preferredHosts, isMine := ss.rendezvousAllHosts(cid)
		if !isMine {
			return nil
		}

		var analysis *QmAudioAnalysis
		err := ss.crud.DB.First(&analysis, "cid = ?", cid).Error
		if err != nil {
			analysis = &QmAudioAnalysis{
				CID:        cid,
				Mirrors:    preferredHosts[0:MAX_TRIES],
				Status:     JobStatusAudioAnalysis,
				AnalyzedAt: time.Now().UTC(),
			}
		}

		if analysis.Status != JobStatusDone && analysis.ErrorCount < MAX_TRIES {
			work <- analysis
		}

		return nil
	})
	if err != nil {
		logger.Error("failed to find qm rows", "err", err)
	}

}

func (ss *MediorumServer) startLegacyAudioAnalysisWorker(n int, work chan *QmAudioAnalysis) {
	for analysis := range work {
		logger := ss.logger.With("analysis_cid", analysis.CID)
		logger.Debug("analyzing legacy audio")
		startTime := time.Now().UTC()
		err := ss.analyzeLegacyAudio(analysis)
		elapsedTime := time.Since(startTime)
		logger = logger.With("duration", elapsedTime.String(), "start_time", startTime)

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
	ctx := context.Background()

	onError := func(err error) error {
		analysis.Error = err.Error()
		if analysis.Error == "blob is not an audio file" {
			// set ErrorCount to 3 so discovery repairer stops retrying this cid
			analysis.ErrorCount = MAX_TRIES
		} else {
			analysis.ErrorCount = analysis.ErrorCount + 1
		}
		analysis.AnalyzedAt = time.Now().UTC()
		analysis.Status = JobStatusError
		ss.crud.Update(analysis)
		return err
	}

	logger := ss.logger.With("analysis_cid", analysis.CID)

	// pull file from bucket

	// as long as this is not the last mirror, do not mark the audio analysis job
	// as failed if this node cannot pull the file from its bucket
	// so that the next mirror may pick the job up
	key := cidutil.ShardCID(analysis.CID)
	attrs, err := ss.bucket.Attributes(ctx, key)
	if err != nil {
		if gcerrors.Code(err) == gcerrors.NotFound {
			// if blob not found, don't increment error count
			// just move on
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
		return onError(err)
	}
	r, err := ss.bucket.NewReader(ctx, key, nil)
	if err != nil {
		logger.Error("failed to read blob", "err", err)
		return onError(err)
	}
	defer r.Close()
	_, err = io.Copy(temp, r)
	if err != nil {
		logger.Error("failed to read blob content", "err", err)
		return onError(err)
	}
	temp.Sync()
	defer temp.Close()
	defer os.Remove(temp.Name())

	// convert the file to WAV for audio processing and truncate to the first 5 minutes
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

	// analyze BPM
	bpm, err := ss.analyzeBPM(wavFile)
	if err != nil {
		return onError(err)
	}

	// analyze musical key
	musicalKey, err := ss.analyzeKey(wavFile)
	if err != nil {
		return onError(err)
	}
	if musicalKey == "" || musicalKey == "Unknown" {
		err := fmt.Errorf("unexpected output: %s", musicalKey)
		return onError(err)
	}

	analysis.Results = &AudioAnalysisResult{
		BPM: bpm,
		Key: musicalKey,
	}

	// all analyses complete
	analysis.Error = ""
	analysis.AnalyzedAt = time.Now().UTC()
	analysis.Status = JobStatusDone
	return ss.crud.Update(analysis)

}
