package server

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/mediorum/cidutil"
	"gocloud.dev/gcerrors"
	"golang.org/x/sync/errgroup"
)

const MAX_TRIES = 3

func (ss *MediorumServer) startAudioAnalyzer() {
	work := make(chan *Upload)

	numWorkers := 4
	numWorkersOverride := os.Getenv("AUDIO_ANALYSIS_WORKERS")
	if numWorkersOverride != "" {
		num, err := strconv.ParseInt(numWorkersOverride, 10, 64)
		if err != nil {
			ss.logger.Warn("failed to parse AUDIO_ANALYSIS_WORKERS", "err", err, "AUDIO_ANALYSIS_WORKERS", numWorkersOverride)
		} else {
			numWorkers = int(num)
		}
	}

	// start workers
	for i := 0; i < numWorkers; i++ {
		go ss.startAudioAnalysisWorker(i, work)
	}

	time.Sleep(time.Minute)

	// in prod... only look for old work on StoreAll nodes
	// see transcode.go line 123 for longer comment
	if ss.Config.Env == "prod" && !ss.Config.StoreAll {
		return
	}

	// find old work from backlog
	for {
		time.Sleep(time.Minute * 5)
		ss.findMissedAudioAnalysisJobs(context.Background(), work)
	}
}

func (ss *MediorumServer) findMissedAudioAnalysisJobs(ctx context.Context, work chan<- *Upload) {
	uploads := []*Upload{}
	err := ss.crud.DB.Where("template = ? and (audio_analysis_status is null or audio_analysis_status != ?)", JobTemplateAudio, JobStatusDone).
		Order("random()").
		Find(&uploads).
		Error

	if err != nil {
		ss.logger.Warn("failed to find backlog work", "err", err)
	}

	for _, upload := range uploads {
		select {
		case <-ctx.Done():
			// if the context is done, stop processing
			return
		default:
		}

		cid, ok := upload.TranscodeResults["320"]
		if !ok {
			if exists, _ := ss.bucket.Exists(ctx, upload.OrigFileCID); exists {
				ss.transcode(upload)
				cid, ok = upload.TranscodeResults["320"]
			}
		}
		if ok {
			if exists, _ := ss.bucket.Exists(ctx, cid); exists {
				work <- upload
			}
		}
	}
}

func (ss *MediorumServer) startAudioAnalysisWorker(n int, work chan *Upload) {
	for upload := range work {
		logger := ss.logger.With("upload", upload.ID)
		logger.Debug("analyzing audio")
		startTime := time.Now().UTC()
		err := ss.analyzeAudio(upload, time.Minute*10)
		elapsedTime := time.Since(startTime)
		logger = logger.With("duration", elapsedTime.String(), "start_time", startTime)

		if err != nil {
			logger.Warn("audio analysis failed", "err", err)
		} else {
			logger.Info("audio analysis done")
		}
	}
}

func (ss *MediorumServer) analyzeAudio(upload *Upload, deadline time.Duration) error {
	upload.AudioAnalyzedAt = time.Now().UTC()
	upload.AudioAnalyzedBy = ss.Config.Self.Host
	upload.Status = JobStatusBusyAudioAnalysis

	ctx, cancel := context.WithTimeout(context.Background(), deadline)
	g, ctx := errgroup.WithContext(ctx)
	defer cancel()

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
	cid, ok := upload.TranscodeResults["320"]
	if !ok {
		if exists, _ := ss.bucket.Exists(ctx, upload.OrigFileCID); exists {
			ss.transcode(upload)
			cid, ok = upload.TranscodeResults["320"]
		}
	}
	if !ok {
		logger.Warn("Upload missing 320 result", "id", upload.ID)
		return nil
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

	var bpm float64
	var musicalKey string

	// goroutine to analyze BPM
	g.Go(func() error {
		var err error
		bpm, err = ss.analyzeBPM(wavFile)
		return err
	})

	g.Go(func() error {
		var err error
		musicalKey, err = ss.analyzeKey(wavFile)
		if err != nil {
			return err
		}
		if musicalKey == "" || musicalKey == "Unknown" {
			err := fmt.Errorf("unexpected output: %s", musicalKey)
			return err
		}
		return nil
	})

	err = g.Wait()
	if err != nil {
		return onError(err)
	}

	// all analyses complete
	upload.AudioAnalysisResults = &AudioAnalysisResult{
		BPM: bpm,
		Key: musicalKey,
	}
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
	cmd := exec.Command("ffmpeg", "-i", inputFile, "-f", "wav", "-t", "60", outputFile)
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to convert to WAV: %v, output: %s", err, string(output))
	}
	return nil
}
