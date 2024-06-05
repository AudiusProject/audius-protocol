package server

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"runtime"
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

	// use most cpus
	numWorkers := runtime.NumCPU() - 2
	if numWorkers < 2 {
		numWorkers = 2
	}

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
		time.Sleep(time.Second * 10)
		ss.findMissedAnalysisJobs(work, myHost)
	}
}

func (ss *MediorumServer) findMissedAnalysisJobs(work chan *Upload, myHost string) {
	queryStartTime := time.Now().UTC()
	uploads := []*Upload{}
	ss.crud.DB.Where("status in ?", []string{JobStatusAudioAnalysis, JobStatusBusyAudioAnalysis}).Find(&uploads)
	queryElapsedTime := time.Since(queryStartTime)

	// extract and log the upload IDs for debugging
	var ids []string
	for _, upload := range uploads {
		ids = append(ids, upload.ID)
	}
	ss.logger.Info("found new or busy audio analysis jobs", "upload_ids", strings.Join(ids, ", "), "count", len(ids), "query_elapsed_time", queryElapsedTime, "query_start_time", queryStartTime)

	for _, upload := range uploads {
		myIdx := slices.Index(upload.TranscodedMirrors, myHost)
		if myIdx == -1 {
			continue
		}
		myRank := myIdx + 1

		logger := ss.logger.With("upload", upload.ID, "upload_status", upload.Status, "my_rank", myRank)

		// allow a 1 minute timeout period for audio analysis.
		// upload.AudioAnalyzedAt is set in transcode.go after successfully transcoding a new audio upload,
		// or by the /uploads/:id/analyze endpoint when triggering a re-analysis.
		if time.Since(upload.AudioAnalyzedAt) > time.Minute {
			// mark analysis as timed out and the upload as done.
			// failed or timed out analyses do not block uploads.
			ss.logger.Warn("audio analysis timed out", "upload", upload.ID, "upload_debug", upload)

			upload.AudioAnalysisStatus = JobStatusTimeout
			// upload.AudioAnalysisErrorCount = upload.AudioAnalysisErrorCount + 1
			upload.Status = JobStatusDone
			ss.crud.Update(upload)
			continue
		}

		// this is already handled by a callback and there's a chance this job gets enqueued twice
		if myRank == 1 && upload.Status == JobStatusAudioAnalysis {
			logger.Info("my upload's audio analysis not started")
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

func (ss *MediorumServer) startAudioAnalysisWorker(n int, work chan *Upload) {
	for upload := range work {
		logger := ss.logger.With("upload", upload.ID)
		if time.Since(upload.AudioAnalyzedAt) > time.Minute {
			logger.Info("audio analysis window has passed. skipping job")
		}

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

	bpmChan := make(chan string)
	keyChan := make(chan string)
	errorChan := make(chan error)

	var mu sync.Mutex

	// goroutine to analyze BPM
	go func() {
		bpmFloat, err := ss.analyzeBPM(wavFile)
		if err != nil {
			logger.Error("failed to analyze BPM", "err", err)
			errorChan <- fmt.Errorf("failed to analyze BPM: %w", err)
			return
		}
		bpm := strconv.FormatFloat(bpmFloat, 'f', 1, 64)
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

	for i := 0; i < 2; i++ {
		select {
		case bpm := <-bpmChan:
			mu.Lock()
			if upload.AudioAnalysisResults == nil {
				upload.AudioAnalysisResults = make(map[string]string)
			}
			upload.AudioAnalysisResults["bpm"] = bpm
			mu.Unlock()
		case musicalKey := <-keyChan:
			mu.Lock()
			if upload.AudioAnalysisResults == nil {
				upload.AudioAnalysisResults = make(map[string]string)
			}
			upload.AudioAnalysisResults["key"] = musicalKey
			mu.Unlock()
		case err := <-errorChan:
			return onError(err)
		}
	}

	// success
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
	temp, err := os.CreateTemp("", "audioAnalysisBPMOutputTemp-*.json")
	if err != nil {
		return 0, err
	}
	defer temp.Close()
	defer os.Remove(temp.Name())

	cmd := exec.Command("/usr/local/bin/essentia_streaming_extractor_freesound", filename, temp.Name())
	err = cmd.Run()
	if err != nil {
		return 0, err
	}
	data, err := os.ReadFile(temp.Name())
	if err != nil {
		return 0, err
	}
	var output map[string]interface{}
	err = json.Unmarshal(data, &output)
	if err != nil {
		return 0, err
	}

	// Extract the BPM value
	bpm := output["rhythm"].(map[string]interface{})["bpm"].(float64)
	return bpm, nil
}

// converts an MP3 file to WAV format using ffmpeg
func convertToWav(inputFile, outputFile string) error {
	cmd := exec.Command("ffmpeg", "-i", inputFile, outputFile)
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to convert to WAV: %v, output: %s", err, string(output))
	}
	return nil
}
