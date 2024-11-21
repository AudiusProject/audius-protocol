package server

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io"
	"log"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/mediorum/cidutil"
	"github.com/AudiusProject/audius-protocol/pkg/mediorum/crudr"

	"github.com/disintegration/imaging"
	"github.com/spf13/cast"
	"golang.org/x/exp/slog"
)

var (
	audioPreviewDuration = "30" // seconds
)

func (ss *MediorumServer) startTranscoder() {
	myHost := ss.Config.Self.Host

	// use most cpus for transcode
	numWorkers := runtime.NumCPU() - 2
	if numWorkers < 2 {
		numWorkers = 2
	}
	numWorkersOverride := os.Getenv("TRANSCODE_WORKERS")
	if numWorkersOverride != "" {
		num, err := strconv.ParseInt(numWorkersOverride, 10, 64)
		if err != nil {
			ss.logger.Warn("failed to parse TRANSCODE_WORKERS", "err", err, "TRANSCODE_WORKERS", numWorkersOverride)
		} else {
			numWorkers = int(num)
		}
	}

	// on boot... reset any of my wip jobs
	for _, statuses := range [][]string{{JobStatusBusy, JobStatusNew}} {
		busyStatus := statuses[0]
		resetStatus := statuses[1]
		tx := ss.crud.DB.Model(Upload{}).
			Where(Upload{
				TranscodedBy: myHost,
				Status:       busyStatus,
			}).
			Updates(Upload{Status: resetStatus})
		if tx.Error != nil {
			ss.logger.Warn("reset stuck uploads error" + tx.Error.Error())
		} else if tx.RowsAffected > 0 {
			ss.logger.Info("reset stuck uploads", "count", tx.RowsAffected)
		}
	}

	// start workers
	for i := 0; i < numWorkers; i++ {
		go ss.startTranscodeWorker(i)
	}

	// add a callback to handle older servers that don't do inline-transcode:
	// if upload server is on older version... pick up job
	// remove this after servers are all > 0.6.190
	if ss.Config.Env == "prod" && ss.Config.StoreAll {
		ss.crud.AddOpCallback(func(op *crudr.Op, records interface{}) {
			if op.Table != "uploads" || op.Action != crudr.ActionCreate {
				return
			}

			uploads, ok := records.(*[]*Upload)
			if !ok {
				return
			}
			for _, upload := range *uploads {
				uploadServerHealth := ss.getPeerHealth(upload.CreatedBy)
				if uploadServerHealth == nil {
					continue
				}

				ver := uploadServerHealth.Version
				if ver != "" && ver < "0.6.190" && upload.Status == JobStatusNew {
					ss.logger.Info("handling non-inline transcode", "id", upload.ID)
					ss.findAndPullBlob(context.Background(), upload.OrigFileCID)
					ss.transcodeWork <- upload
				}
			}
		})
	}

	// hash-migration: the findMissedJobs was using the og `mirrors` list
	// to determine if this server should transocde the file
	// with the assumption that if server was in mirrors list it would have the orig upload.
	// but hash migration changed that assumption...
	// so hosts would try to transcode and would not have the orig
	// which would issue a crudr update to put transcode job in error state.
	//
	// This is a temporary fix in prod to only find missing transcode jobs on StoreAll nodes
	// which will have the orig.
	//
	// long term fix is to move transcode inline to upload...
	if ss.Config.Env == "prod" && !ss.Config.StoreAll {
		return
	}

	// finally... poll periodically for uploads that slipped thru the cracks
	for {
		time.Sleep(time.Minute)
		ss.findMissedJobs(ss.transcodeWork, myHost)
	}
}

func (ss *MediorumServer) findMissedJobs(work chan *Upload, myHost string) {
	newStatus := JobStatusNew
	busyStatus := JobStatusBusy
	errorStatus := JobStatusError

	uploads := []*Upload{}
	ss.crud.DB.Where("status in ?", []string{newStatus, busyStatus, errorStatus}).Find(&uploads)

	for _, upload := range uploads {
		if upload.ErrorCount > 5 {
			continue
		}

		// don't re-process if it was updated recently
		if time.Since(upload.TranscodedAt) < time.Minute {
			continue
		}

		work <- upload
	}
}

func (ss *MediorumServer) startTranscodeWorker(_ int) {
	for upload := range ss.transcodeWork {
		ss.logger.Debug("transcoding", "upload", upload.ID)
		err := ss.transcode(upload)
		if err != nil {
			ss.logger.Warn("transcode failed", "upload", upload, "err", err)
		}
	}
}

func (ss *MediorumServer) getKeyToTempFile(fileHash string) (*os.File, error) {
	temp, err := os.CreateTemp("", "mediorumTemp")
	if err != nil {
		return nil, err
	}

	key := cidutil.ShardCID(fileHash)
	blob, err := ss.bucket.NewReader(context.Background(), key, nil)
	if err != nil {
		return nil, err
	}
	defer blob.Close()

	_, err = io.Copy(temp, blob)
	if err != nil {
		return nil, err
	}
	temp.Sync()

	return temp, nil
}

type errorCallback func(err error, uploadStatus string, info ...string) error

func (ss *MediorumServer) transcodeAudio(upload *Upload, _ string, cmd *exec.Cmd, logger *slog.Logger, onError errorCallback) error {
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return onError(err, upload.Status, "cmd.StdoutPipe")
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return onError(err, upload.Status, "cmd.StderrPipe")
	}

	err = cmd.Start()
	if err != nil {
		return onError(err, upload.Status, "cmd.Start")
	}

	// WaitGroup to make sure all stdout/stderr processing is done before cmd.Wait() is called
	var wg sync.WaitGroup
	wg.Add(2)

	var stderrBuf bytes.Buffer
	var stdoutBuf bytes.Buffer

	// Log stdout
	go func() {
		defer wg.Done()

		stdoutLines := bufio.NewScanner(stdout)
		for stdoutLines.Scan() {
			stdoutBuf.WriteString(stdoutLines.Text())
			stdoutBuf.WriteString("\n")
		}
		if err := stdoutLines.Err(); err != nil {
			logger.Error("stdoutLines.Scan", "err", err)
		}
		logger.Info("stdout lines: " + stdoutBuf.String())
	}()

	// Log stderr and parse it to update transcode progress
	go func() {
		defer wg.Done()

		stderrLines := bufio.NewScanner(stderr)

		durationUs := float64(0)
		if upload.FFProbe != nil {
			durationSeconds := cast.ToFloat64(upload.FFProbe.Format.Duration)
			durationUs = durationSeconds * 1000 * 1000
		}

		for stderrLines.Scan() {
			line := stderrLines.Text()
			stderrBuf.WriteString(line)
			stderrBuf.WriteString("\n")

			if upload.FFProbe != nil {
				var u float64
				fmt.Sscanf(line, "out_time_us=%f", &u)
				if u > 0 && durationUs > 0 {
					percent := u / durationUs

					if percent-upload.TranscodeProgress > 0.1 {
						upload.TranscodeProgress = percent
						upload.TranscodedAt = time.Now().UTC()
						ss.crud.Patch(upload)
					}
				}
			}
		}

		if err := stderrLines.Err(); err != nil {
			logger.Error("stderrLines.Scan", "err", err)
		}
		// logger.Error("stderr lines: " + stderrBuf.String())
	}()

	wg.Wait()

	err = cmd.Wait()
	if err != nil {
		return onError(err, upload.Status, "ffmpeg", "stdout="+stdoutBuf.String(), "stderr="+stderrBuf.String())
	}

	return nil
}

func (ss *MediorumServer) transcodeFullAudio(upload *Upload, temp *os.File, logger *slog.Logger, onError errorCallback) error {
	srcPath := temp.Name()
	destPath := srcPath + "_320.mp3"
	defer os.Remove(destPath)

	cmd := exec.Command("ffmpeg",
		"-y",
		"-i", srcPath,
		"-b:a", "320k", // set bitrate to 320k
		"-ar", "48000", // set sample rate to 48000 Hz
		"-f", "mp3", // force output to mp3
		"-c:a", "libmp3lame", // specify the encoder
		"-metadata", fmt.Sprintf(`fileName="%s"`, upload.OrigFileName),
		"-metadata", fmt.Sprintf(`uuid="%s"`, upload.ID), // make each upload unique so artists can re-upload same file with different CID if it gets delisted
		"-vn",           // no video
		"-threads", "2", // limit to 2 threads per worker to avoid CPU spikes
		"-progress", "pipe:2",
		destPath)

	err := ss.transcodeAudio(upload, destPath, cmd, logger, onError)
	if err != nil {
		return err
	}

	dest, err := os.Open(destPath)
	if err != nil {
		return onError(err, upload.Status, "os.Open")
	}
	defer dest.Close()

	// replicate to peers
	// attempt to forward to an assigned node
	resultHash, err := cidutil.ComputeFileCID(dest)
	if err != nil {
		return onError(err, upload.Status, "computeFileCID")
	}
	resultKey := resultHash
	upload.TranscodedMirrors, err = ss.replicateFileParallel(resultHash, destPath, upload.PlacementHosts)
	if err != nil {
		return onError(err, upload.Status, "replicateFile")
	}

	// transcode server will retain transcode result for analysis
	ss.replicateToMyBucket(resultHash, dest)

	upload.TranscodeResults["320"] = resultKey

	logger.Info("audio transcode done", "mirrors", upload.TranscodedMirrors)

	// if a start time is set, also transcode an audio preview from the full 320kbps downsample
	if upload.SelectedPreview.Valid {
		err := ss.generateAudioPreviewForUpload(upload)
		if err != nil {
			return onError(err, upload.Status, "generateAudioPreview")
		}
	}

	return nil
}

func filterErrorLines(input string, errorTypes []string, maxCount int) string {
	lines := strings.Split(input, "\\n")
	var builder strings.Builder
	errorCounts := make(map[string]int)

outerLoop:
	for _, line := range lines {
		for _, errorType := range errorTypes {
			if strings.Contains(line, errorType) {
				if errorCounts[errorType] < maxCount {
					errorCounts[errorType]++
					builder.WriteString(line + "\\n")
				}
				continue outerLoop
			}
		}
		builder.WriteString(line + "\\n")
	}

	return builder.String()
}

func (ss *MediorumServer) transcode(upload *Upload) error {
	upload.TranscodedBy = ss.Config.Self.Host
	upload.TranscodedAt = time.Now().UTC()
	upload.Status = JobStatusBusy
	fileHash := upload.OrigFileCID

	logger := ss.logger.With("template", upload.Template, "cid", fileHash)

	if !ss.haveInMyBucket(fileHash) {
		_, err := ss.findAndPullBlob(context.Background(), fileHash)
		if err != nil {
			logger.Warn("failed to find blob", "err", err)
			return err
		}
	}

	onError := func(err error, uploadStatus string, info ...string) error {
		// limit repetitive lines
		errorTypes := []string{
			"Header missing",
			"Error while decoding",
			"Invalid data",
			"Application provided invalid",
			"out_time_ms=",
			"out_time_us",
			"bitrate=",
			"progress=",
		}
		filteredError := filterErrorLines(err.Error(), errorTypes, 10)
		errMsg := fmt.Errorf("%s %s", filteredError, strings.Join(info, " "))

		upload.Error = errMsg.Error()
		upload.Status = JobStatusError
		upload.ErrorCount = upload.ErrorCount + 1
		ss.crud.Update(upload)
		return errMsg
	}

	temp, err := ss.getKeyToTempFile(fileHash)
	if err != nil {
		return onError(err, upload.Status, "getting file")
	}
	defer temp.Close()
	defer os.Remove(temp.Name())

	switch JobTemplate(upload.Template) {
	case JobTemplateAudio, "":
		if upload.Template == "" {
			logger.Warn("empty template (shouldn't happen), falling back to audio")
		}

		err := ss.transcodeFullAudio(upload, temp, logger, onError)
		if err != nil {
			return err
		}
		ss.analyzeAudio(upload, time.Minute)

	default:
		return fmt.Errorf("unsupported format: %s", upload.Template)
	}

	upload.TranscodeProgress = 1
	upload.TranscodedAt = time.Now().UTC()
	upload.Status = JobStatusDone
	upload.Error = ""
	ss.crud.Update(upload)

	return nil
}

type FFProbeResult struct {
	Format struct {
		Filename       string `json:"filename"`
		FormatName     string `json:"format_name"`
		FormatLongName string `json:"format_long_name"`
		Duration       string `json:"duration,omitempty"`
		Size           string `json:"size"`
		BitRate        string `json:"bit_rate,omitempty"`
	} `json:"format"`
}

func ffprobe(sourcePath string) (*FFProbeResult, error) {
	probe, err := exec.Command("ffprobe",
		"-v", "quiet",
		"-print_format", "json",
		"-show_format",
		sourcePath).
		Output()

	if err != nil {
		return nil, err
	}

	// fmt.Println(string(probe))
	var probeResult *FFProbeResult
	err = json.Unmarshal(probe, &probeResult)
	return probeResult, err
}

const AUTO = -1

func Resized(ext string, read io.ReadSeeker, width, height int, mode string) (resized io.ReadSeeker, w int, h int) {
	if width == 0 && height == 0 {
		return read, 0, 0
	}
	srcImage, _, err := image.Decode(read)
	if err == nil {
		bounds := srcImage.Bounds()
		var dstImage *image.NRGBA

		// Maintain aspect ratio when auto-resizing height based on target width
		if height == AUTO {
			srcW := bounds.Dx()
			srcH := bounds.Dy()
			autoHeight := float64(srcH) * (float64(width) / float64(srcW))
			height = int(autoHeight)
		}

		switch mode {
		case "fit":
			dstImage = imaging.Fit(srcImage, width, height, imaging.Lanczos)
		case "fill":
			dstImage = imaging.Fill(srcImage, width, height, imaging.Center, imaging.Lanczos)
		default:
			if width == height && bounds.Dx() != bounds.Dy() {
				dstImage = imaging.Thumbnail(srcImage, width, height, imaging.Lanczos)
				w, h = width, height
			} else {
				dstImage = imaging.Resize(srcImage, width, height, imaging.Lanczos)
			}
		}

		var buf bytes.Buffer
		switch ext {
		case ".png":
			png.Encode(&buf, dstImage)
		case ".jpg", ".jpeg":
			jpeg.Encode(&buf, dstImage, nil)
		case ".gif":
			gif.Encode(&buf, dstImage, nil)
		}
		return bytes.NewReader(buf.Bytes()), dstImage.Bounds().Dx(), dstImage.Bounds().Dy()
	} else {
		log.Println(err)
	}
	return read, 0, 0
}
