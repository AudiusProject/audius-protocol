package server

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/AudiusProject/audius-protocol/mediorum/cidutil"
	"github.com/AudiusProject/audius-protocol/mediorum/crudr"
	"gocloud.dev/gcerrors"
	"golang.org/x/exp/slices"
)

func (ss *MediorumServer) startAudioAnalyzer() {
	myHost := ss.Config.Self.Host
	work := make(chan *Upload)

	numWorkers := 2

	// on boot... reset any of my wip jobs
	tx := ss.crud.DB.Model(Upload{}).
		Where(Upload{
			AudioAnalyzedBy: myHost,
			Status:          JobStatusBusyAudioAnalysis,
		}).
		Updates(Upload{Status: JobStatusAudioAnalysis})
	if tx.Error != nil {
		ss.logger.Warn("reset stuck audio analyses error" + tx.Error.Error())
	} else if tx.RowsAffected > 0 {
		ss.logger.Info("reset stuck audio analyses", "count", tx.RowsAffected)
	}

	// add a callback to crudr so we can consider audio analyses
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
			if upload.Status == JobStatusAudioAnalysis && upload.Template == "audio" {
				if upload.TranscodedMirrors == nil {
					ss.logger.Warn("missing full transcoded mp3 data in audio analysis job. skipping", "upload", upload.ID)
					continue
				}
				// only the first mirror transcodes
				if slices.Index(upload.TranscodedMirrors, myHost) == 0 {
					ss.logger.Info("got audio analysis job", "upload", upload.ID)
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
	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()

		retryTicker := time.NewTicker(30 * time.Second)
		defer retryTicker.Stop()

		for {
			select {
			case <-ticker.C:
				// find missed legacy analysis jobs every 10 seconds
				// mark uploads with timed out analyses as done
				ss.findMissedAnalysisJobs(work, myHost)

			case <-retryTicker.C:
				// retry analysis jobs every 30 seconds
				ss.retryAnalysisJobs(work, myHost)
			}
		}
	}()

	// block to keep running
	select {}
}

func (ss *MediorumServer) findMissedAnalysisJobs(work chan *Upload, myHost string) {
	uploads := []*Upload{}
	ss.crud.DB.Where("status in ?", []string{JobStatusAudioAnalysis, JobStatusBusyAudioAnalysis}).Find(&uploads)

	for _, upload := range uploads {
		// allow a 1 minute timeout period for audio analysis.
		// upload.AudioAnalyzedAt is set in transcode.go after successfully transcoding a new audio upload,
		// or by the /uploads/:id/analyze endpoint when triggering a re-analysis.
		if time.Since(upload.AudioAnalyzedAt) > time.Minute {
			// mark analysis as timed out and the upload as done.
			// failed or timed out analyses do not block uploads.
			ss.logger.Warn("audio analysis timed out", "upload", upload.ID, "upload_debug", upload)

			upload.AudioAnalysisStatus = JobStatusTimeout
			upload.Status = JobStatusDone
			ss.crud.Update(upload)
			continue
		}

		myIdx := slices.Index(upload.TranscodedMirrors, myHost)
		if myIdx == -1 {
			continue
		}
		myRank := myIdx + 1

		logger := ss.logger.With("upload", upload.ID, "upload_status", upload.Status, "my_rank", myRank)

		// determine if #1 rank worker dropped ball
		timedOut := false
		neverStarted := false

		// for #2 rank worker:
		if myRank == 2 {
			// no recent update?
			timedOut = upload.Status == JobStatusBusyAudioAnalysis &&
				time.Since(upload.AudioAnalyzedAt) > time.Second*20

			// never started?
			neverStarted = upload.Status == JobStatusAudioAnalysis &&
				time.Since(upload.AudioAnalyzedAt) > time.Second*20
		}

		// for #3 rank worker:
		if myRank == 3 {
			// no recent update?
			timedOut = upload.Status == JobStatusBusyAudioAnalysis &&
				time.Since(upload.AudioAnalyzedAt) > time.Second*40

			// never started?
			neverStarted = upload.Status == JobStatusAudioAnalysis &&
				time.Since(upload.AudioAnalyzedAt) > time.Second*40
		}

		if timedOut {
			logger.Info("audio analysis timed out... starting")
			work <- upload
		} else if neverStarted {
			logger.Info("audio analysis never started")
			work <- upload
		}
	}
}

func (ss *MediorumServer) retryAnalysisJobs(work chan *Upload, myHost string) {
	uploads := []*Upload{}
	ss.crud.DB.Where("audio_analysis_status = ? OR (audio_analysis_status = ? AND audio_analysis_error_count < ?)", JobStatusTimeout, JobStatusError, 3).
		Where("status = ?", JobStatusDone).
		Where("CAST(transcoded_mirrors AS jsonb)->>0 = ?", myHost).
		Order("audio_analyzed_at ASC").
		Limit(2).
		Find(&uploads)

	for _, upload := range uploads {
		myIdx := slices.Index(upload.TranscodedMirrors, myHost)
		if myIdx != 0 {
			continue
		}
		myRank := myIdx + 1

		logger := ss.logger.With("upload", upload.ID, "audio_analysis_status", upload.AudioAnalysisStatus, "my_rank", myRank)

		if upload.AudioAnalysisStatus == JobStatusError {
			logger.Info("retrying my errored audio analysis")
		}
		if upload.AudioAnalysisStatus == JobStatusTimeout {
			logger.Info("retrying my timed out audio analysis")
		}
		upload.AudioAnalyzedAt = time.Now().UTC()
		// op callback will enqueue the job
		upload.Status = JobStatusAudioAnalysis
		ss.crud.Update(upload)
	}
}

func (ss *MediorumServer) startAudioAnalysisWorker(n int, work chan *Upload) {
	for upload := range work {
		logger := ss.logger.With("upload", upload.ID)
		logger.Debug("analyzing audio")
		startTime := time.Now().UTC()
		err := ss.analyzeAudio(upload)
		elapsedTime := time.Since(startTime)
		logger = logger.With("duration", elapsedTime, "start_time", startTime)

		if err != nil {
			logger.Warn("audio analysis failed", "err", err)
		} else {
			logger.Info("audio analysis done")
		}
	}
}

func (ss *MediorumServer) analyzeAudio(upload *Upload) error {
	upload.AudioAnalyzedBy = ss.Config.Self.Host
	upload.Status = JobStatusBusyAudioAnalysis
	ss.crud.Update(upload)
	ctx := context.Background()

	onError := func(err error) error {
		upload.AudioAnalysisError = err.Error()
		upload.AudioAnalysisErrorCount = upload.AudioAnalysisErrorCount + 1
		upload.AudioAnalyzedAt = time.Now().UTC()
		upload.AudioAnalysisStatus = JobStatusError
		// failed analyses do not block uploads
		upload.Status = JobStatusDone
		ss.crud.Update(upload)
		return err
	}

	logger := ss.logger.With("upload", upload.ID)

	// pull transcoded file from bucket
	cid, exists := upload.TranscodeResults["320"]
	if !exists {
		err := errors.New("audio upload missing 320kbps cid")
		return onError(err)
	}

	// do not mark the audio analysis job as failed if this node cannot pull the file from its bucket
	// so that the next mirror may pick the job up
	logger = logger.With("cid", cid)
	key := cidutil.ShardCID(cid)
	attrs, err := ss.bucket.Attributes(ctx, key)
	if err != nil {
		if gcerrors.Code(err) == gcerrors.NotFound {
			return errors.New("failed to find audio file on node")
		} else {
			return err
		}
	}
	temp, err := os.CreateTemp("", "audioAnalysisTemp")
	if err != nil {
		logger.Error("failed to create temp file", "err", err)
		return err
	}
	r, err := ss.bucket.NewReader(ctx, key, nil)
	if err != nil {
		logger.Error("failed to read blob", "err", err)
		return err
	}
	defer r.Close()
	_, err = io.Copy(temp, r)
	if err != nil {
		logger.Error("failed to read blob content", "err", err)
		return err
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
	firstResult := true

	for i := 0; i < 2; i++ {
		select {
		case bpm := <-bpmChan:
			mu.Lock()
			if upload.AudioAnalysisResults == nil {
				upload.AudioAnalysisResults = &AudioAnalysisResult{}
			}
			upload.AudioAnalysisResults.BPM = bpm
			if firstResult {
				ss.crud.Update(upload)
				firstResult = false
			}
			mu.Unlock()
		case musicalKey := <-keyChan:
			mu.Lock()
			if upload.AudioAnalysisResults == nil {
				upload.AudioAnalysisResults = &AudioAnalysisResult{}
			}
			upload.AudioAnalysisResults.Key = musicalKey
			if firstResult {
				ss.crud.Update(upload)
				firstResult = false
			}
			mu.Unlock()
		case err := <-errorChan:
			return onError(err)
		}
	}

	// all analyses complete
	upload.AudioAnalysisError = ""
	upload.AudioAnalyzedAt = time.Now().UTC()
	upload.AudioAnalysisStatus = JobStatusDone
	upload.Status = JobStatusDone
	ss.crud.Update(upload)

	return nil
}

func (ss *MediorumServer) analyzeKey(filename string) (string, error) {
	cmd := exec.Command("/bin/analyze-key", filename)
	output, err := cmd.CombinedOutput()
	if err != nil {
		exitError, ok := err.(*exec.ExitError)
		if ok {
			return "", fmt.Errorf("command exited with status %d: %s", exitError.ExitCode(), string(output))
		}
		return "", fmt.Errorf("failed to execute command: %v", err)
	}
	formattedOutput := strings.ReplaceAll(string(output), "\n", "")
	return formattedOutput, nil
}

func (ss *MediorumServer) analyzeBPM(filename string) (float64, error) {
	cmd := exec.Command("/bin/analyze-bpm", filename)
	output, err := cmd.CombinedOutput()
	if err != nil {
		exitError, ok := err.(*exec.ExitError)
		if ok {
			return 0, fmt.Errorf("command exited with status %d: %s", exitError.ExitCode(), string(output))
		}
		return 0, fmt.Errorf("failed to execute command: %v", err)
	}

	outputStr := string(output)
	lines := strings.Split(outputStr, "\n")
	var bpm float64
	for _, line := range lines {
		if strings.HasPrefix(line, "BPM:") {
			parts := strings.Fields(line)
			if len(parts) == 2 {
				bpm, err = strconv.ParseFloat(parts[1], 64)
				if err != nil {
					return 0, fmt.Errorf("failed to parse BPM from output %s: %v", outputStr, err)
				}
			}
		}
	}

	if bpm == 0 {
		return 0, fmt.Errorf("failed to parse BPM from output %s", outputStr)
	}

	// Round float to 1 decimal place
	bpmRoundedStr := strconv.FormatFloat(bpm, 'f', 1, 64)
	bpmRounded, err := strconv.ParseFloat(bpmRoundedStr, 64)
	if err != nil {
		return 0, fmt.Errorf("failed to parse formatted BPM string %s: %v", bpmRoundedStr, err)
	}

	return bpmRounded, nil
}

// converts an MP3 file to WAV format using ffmpeg
func convertToWav(inputFile, outputFile string) error {
	cmd := exec.Command("ffmpeg", "-i", inputFile, "-f", "wav", "-t", "300", outputFile)
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to convert to WAV: %v, output: %s", err, string(output))
	}
	return nil
}
