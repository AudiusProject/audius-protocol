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
	"mediorum/cidutil"
	"mediorum/crudr"
	"mime/multipart"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/disintegration/imaging"
	"github.com/spf13/cast"
	"golang.org/x/exp/slices"
	"golang.org/x/exp/slog"
)

var (
	audioPreviewDuration = "30" // seconds
)

func (ss *MediorumServer) startTranscoder() {
	myHost := ss.Config.Self.Host
	work := make(chan *Upload)
	numWorkers := 2

	// on boot... reset any of my wip jobs
	for _, statuses := range [][]string{{JobStatusBusy, JobStatusNew}, {JobStatusBusyRetranscode, JobStatusRetranscode}} {
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

	// add a callback to crudr that so we can consider new uploads
	ss.crud.AddOpCallback(func(op *crudr.Op, records interface{}) {
		if op.Table != "uploads" || op.Action != crudr.ActionCreate {
			return
		}

		uploads, ok := records.(*[]*Upload)
		if !ok {
			log.Printf("unexpected type in transcode callback %T", records)
			return
		}
		for _, upload := range *uploads {
			// only the first mirror transcodes
			if upload.Status == JobStatusNew && slices.Index(upload.Mirrors, myHost) == 0 {
				ss.logger.Info("got transcode job", "id", upload.ID)
				work <- upload
			}
		}
	})

	// add a callback to crudr that so we can consider audio preview retranscodes
	ss.crud.AddOpCallback(func(op *crudr.Op, records interface{}) {
		if op.Table != "uploads" || op.Action != crudr.ActionUpdate {
			return
		}

		uploads, ok := records.(*[]*Upload)
		if !ok {
			log.Printf("unexpected type in transcode callback %T", records)
			return
		}
		for _, upload := range *uploads {
			if upload.Status == JobStatusRetranscode {
				if upload.TranscodedMirrors == nil {
					ss.logger.Warn("missing full transcoded mp3 data in retranscode job. skipping", "id", upload.ID)
					continue
				}
				// only the first mirror transcodes
				if slices.Index(upload.TranscodedMirrors, myHost) == 0 {
					ss.logger.Info("got retranscode job", "id", upload.ID)
					work <- upload
				}
			}
		}
	})

	// start workers
	for i := 0; i < numWorkers; i++ {
		go ss.startTranscodeWorker(i, work)
	}

	// finally... poll periodically for uploads that slipped thru the cracks
	for {
		time.Sleep(time.Minute)
		// find missed transcode jobs
		ss.findMissedJobs(work, myHost, false)
		// find missed retranscode jobs
		ss.findMissedJobs(work, myHost, true)
	}
}

func (ss *MediorumServer) findMissedJobs(work chan *Upload, myHost string, retranscode bool) {
	newStatus := JobStatusNew
	busyStatus := JobStatusBusy
	errorStatus := JobStatusError
	if retranscode {
		newStatus = JobStatusRetranscode
		busyStatus = JobStatusBusyRetranscode
		errorStatus = JobStatusErrorRetranscode
	}

	uploads := []*Upload{}
	ss.crud.DB.Where("status in ?", []string{newStatus, busyStatus, errorStatus}).Find(&uploads)

	for _, upload := range uploads {
		if upload.ErrorCount > 100 {
			continue
		}

		mirrors := upload.Mirrors
		if retranscode {
			if upload.TranscodedMirrors == nil {
				ss.logger.Warn("missing full transcoded mp3 mirrors in retranscode job. skipping", "id", upload.ID)
				continue
			}
			mirrors = upload.TranscodedMirrors
		}

		myIdx := slices.Index(mirrors, myHost)
		if myIdx == -1 {
			continue
		}
		myRank := myIdx + 1

		logger := ss.logger.With("upload_id", upload.ID, "upload_status", upload.Status, "my_rank", myRank)

		// normally this job of mine would start via callback
		// but just in case we could enqueue it here.
		// there's a chance it would be processed twice if the callback and this loop
		// ran at the same instant...
		// but I'm not too worried about that race condition

		if myRank == 1 && upload.Status == newStatus {
			logger.Info("my upload not started")
			work <- upload
			continue
		}

		// determine if #1 rank worker dropped ball
		timedOut := false
		neverStarted := false

		// for #2 rank worker:
		if myRank == 2 {
			// no recent update?
			timedOut = upload.Status == busyStatus &&
				time.Since(upload.TranscodedAt) > time.Minute

			// never started?
			neverStarted = upload.Status == newStatus &&
				time.Since(upload.CreatedAt) > time.Minute*2
		}

		// for #3 rank worker:
		if myRank == 3 {
			// no recent update?
			timedOut = upload.Status == busyStatus &&
				time.Since(upload.TranscodedAt) > time.Minute*5

			// never started?
			neverStarted = upload.Status == newStatus &&
				time.Since(upload.CreatedAt) > time.Minute*5
		}

		if timedOut {
			logger.Info("upload timed out... starting")
			work <- upload
		} else if neverStarted {
			logger.Info("upload never started")
			work <- upload
		}

		// take turns retrying errors
		if upload.Status == errorStatus && upload.ErrorCount%len(mirrors) == myIdx {
			logger.Info("retrying transcode error", "error_count", upload.ErrorCount)
			work <- upload
		}
	}
}

func (ss *MediorumServer) startTranscodeWorker(n int, work chan *Upload) {
	for upload := range work {
		ss.logger.Debug("transcoding", "upload", upload.ID)
		err := ss.transcode(upload)
		if err != nil {
			ss.logger.Warn("transcode failed", "upload", upload, "err", err)
		}
	}
}

type JobTemplate string

const (
	JobTemplateAudio       JobTemplate = "audio"
	JobTemplateImgSquare   JobTemplate = "img_square"
	JobTemplateImgBackdrop JobTemplate = "img_backdrop"
)

const (
	JobStatusNew   = "new"
	JobStatusError = "error"
	JobStatusBusy  = "busy"

	JobStatusRetranscode      = "retranscode_preview"
	JobStatusBusyRetranscode  = "busy_retranscode_preview"
	JobStatusErrorRetranscode = "error_retranscode_preview"

	JobStatusDone = "done"
)

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

func (ss *MediorumServer) transcodeAudio(upload *Upload, destPath string, cmd *exec.Cmd, logger *slog.Logger, onError errorCallback) error {
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

	// Log stdout
	go func() {
		defer wg.Done()
		var stdoutBuf bytes.Buffer
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
		var stderrBuf bytes.Buffer
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
					// logger.Debug("transcode", "file", fileHash, "progress", percent)
					upload.TranscodeProgress = percent
					upload.TranscodedAt = time.Now().UTC()
					ss.crud.Patch(upload)
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
		return onError(err, upload.Status, "cmd.Wait")
	}

	return nil
}

func (ss *MediorumServer) transcodeFullAudio(upload *Upload, temp *os.File, logger *slog.Logger, onError errorCallback) error {
	srcPath := temp.Name()
	destPath := srcPath + "_320.mp3"

	cmd := exec.Command("ffmpeg",
		"-y",
		"-i", srcPath,
		"-b:a", "320k", // set bitrate to 320k
		"-ar", "48000", // set sample rate to 48000 Hz
		"-f", "mp3", // force output to mp3
		"-metadata", fmt.Sprintf(`fileName="%s"`, upload.OrigFileName),
		"-metadata", fmt.Sprintf(`uuid="%s"`, upload.ID), // make each upload unique so artists can re-upload same file with different CID if it gets delisted
		"-vn", // no video
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
	upload.TranscodedMirrors, err = ss.replicateFile(resultHash, dest)
	if err != nil {
		return onError(err, upload.Status, "replicateFile")
	}

	upload.TranscodeResults["320"] = resultKey

	logger.Info("audio transcode done", "mirrors", upload.TranscodedMirrors)

	// if a start time is set, also transcode an audio preview from the full 320kbps downsample
	if upload.SelectedPreview.Valid {
		// update upload to reflect the start of the retranscoding preview step
		upload.TranscodeProgress = 0
		upload.TranscodedAt = time.Now().UTC()
		upload.Status = JobStatusBusyRetranscode
		ss.crud.Update(upload)

		return ss.transcodeAudioPreview(upload, dest, logger, onError)
	}

	return nil
}

func (ss *MediorumServer) transcodeAudioPreview(upload *Upload, temp *os.File, logger *slog.Logger, onError errorCallback) error {
	if !upload.SelectedPreview.Valid {
		logger.Info("no audio preview start time set. skipping preview transcode", "id", upload.ID)
		return nil
	}

	srcPath := temp.Name()
	destPath := strings.TrimSuffix(srcPath, "_320.mp3") + "_320_preview.mp3"

	splitPreview := strings.Split(upload.SelectedPreview.String, "|")
	previewStart := splitPreview[1]

	cmd := exec.Command("ffmpeg",
		"-y",
		"-i", srcPath,
		"-ss", previewStart, // set preview start time
		"-t", audioPreviewDuration, // set preview duration
		"-b:a", "320k", // set bitrate to 320k
		"-ar", "48000", // set sample rate to 48000 Hz
		"-f", "mp3", // force output to mp3
		"-metadata", fmt.Sprintf(`fileName="%s"`, upload.OrigFileName),
		"-metadata", fmt.Sprintf(`uuid="%s"`, upload.ID), // make each upload unique so artists can re-upload same file with different CID if it gets delisted
		"-vn", // no video
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
	mirrors, err := ss.replicateFile(resultHash, dest)
	if err != nil {
		return onError(err, upload.Status, "replicating file")
	}

	upload.TranscodeResults[upload.SelectedPreview.String] = resultKey

	logger.Info("audio preview transcode done", "mirrors", mirrors)

	return nil
}

func (ss *MediorumServer) transcode(upload *Upload) error {
	upload.TranscodedBy = ss.Config.Self.Host
	upload.TranscodedAt = time.Now().UTC()
	// Differentiate between normal transcode vs retranscode jobs
	if upload.Status == JobStatusRetranscode || upload.Status == JobStatusBusyRetranscode || upload.Status == JobStatusErrorRetranscode {
		upload.Status = JobStatusBusyRetranscode
	} else {
		upload.Status = JobStatusBusy
	}
	ss.crud.Update(upload)

	fileHash := upload.OrigFileCID
	if upload.Status == JobStatusBusyRetranscode {
		// Re-transcode previews off the 320kbps downsample
		fileHash = upload.TranscodeResults["320"]
	}

	logger := ss.logger.With("template", upload.Template, "cid", fileHash)

	onError := func(err error, uploadStatus string, info ...string) error {
		errMsg := fmt.Errorf("%s %s", err, strings.Join(info, " "))
		upload.Error = errMsg.Error()
		if uploadStatus == JobStatusRetranscode || uploadStatus == JobStatusBusyRetranscode {
			upload.Status = JobStatusErrorRetranscode
		} else {
			upload.Status = JobStatusError
		}
		upload.ErrorCount = upload.ErrorCount + 1
		ss.crud.Update(upload)
		logger.Error("transcode error", "err", errMsg.Error())
		return errMsg
	}

	temp, err := ss.getKeyToTempFile(fileHash)
	if err != nil {
		return onError(err, upload.Status, "getting file")
	}
	defer temp.Close()
	defer os.Remove(temp.Name())

	switch JobTemplate(upload.Template) {
	case JobTemplateImgSquare:
		// 150x150, 480x480, 1000x1000
		squares := []int{150, 480, 1000}
		for _, targetBox := range squares {
			temp.Seek(0, 0)
			out, w, h := Resized(".jpg", temp, targetBox, targetBox, "fill")
			resultHash, err := cidutil.ComputeFileCID(out)
			if err != nil {
				return onError(err, upload.Status, "computeFileCID")
			}
			mirrors, err := ss.replicateFile(resultHash, out)
			if err != nil {
				return onError(err, upload.Status, "replicate")
			}
			logger.Debug("did square", "w", w, "h", h, "key", resultHash, "mirrors", mirrors)

			variantName := fmt.Sprintf("%dx%[1]d.jpg", targetBox)
			upload.TranscodeResults[variantName] = resultHash
		}

	case JobTemplateImgBackdrop:
		// 640x, 2000x
		widths := []int{640, 2000}
		for _, targetWidth := range widths {
			temp.Seek(0, 0)
			out, w, h := Resized(".jpg", temp, targetWidth, AUTO, "fill")
			resultHash, err := cidutil.ComputeFileCID(out)
			if err != nil {
				return onError(err, upload.Status, "computeFileCID")
			}
			mirrors, err := ss.replicateFile(resultHash, out)
			if err != nil {
				return onError(err, upload.Status, "replicate")
			}
			logger.Debug("did backdrop", "w", w, "h", h, "key", resultHash, "mirrors", mirrors)

			variantName := fmt.Sprintf("%dx.jpg", targetWidth)
			upload.TranscodeResults[variantName] = resultHash
		}

	case JobTemplateAudio, "":
		if upload.Template == "" {
			logger.Warn("empty template (shouldn't happen), falling back to audio")
		}

		if upload.Status == JobStatusBusyRetranscode {
			// Re-transcode audio preview
			err := ss.transcodeAudioPreview(upload, temp, logger, onError)
			if err != nil {
				return err
			}
		} else {
			// Transcode audio and (optional) audio preview
			err := ss.transcodeFullAudio(upload, temp, logger, onError)
			if err != nil {
				return err
			}
		}
	}

	upload.TranscodeProgress = 1
	upload.TranscodedAt = time.Now().UTC()
	upload.Status = "done"
	upload.Error = ""
	ss.crud.Update(upload)

	return nil
}

type FFProbeResult struct {
	Format struct {
		Filename       string            `json:"filename"`
		NbStreams      int               `json:"nb_streams"`
		NbPrograms     int               `json:"nb_programs"`
		FormatName     string            `json:"format_name"`
		FormatLongName string            `json:"format_long_name"`
		Duration       string            `json:"duration,omitempty"`
		Size           string            `json:"size"`
		BitRate        string            `json:"bit_rate,omitempty"`
		ProbeScore     int               `json:"probe_score"`
		Tags           map[string]string `json:"tags,omitempty"`
	} `json:"format"`
}

func ffprobeUpload(file *multipart.FileHeader) (*FFProbeResult, error) {
	temp, err := os.CreateTemp("", "mediorumProbe")
	if err != nil {
		return nil, err
	}

	r, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer r.Close()

	_, err = io.Copy(temp, r)
	if err != nil {
		return nil, err
	}
	temp.Close()
	defer os.Remove(temp.Name())

	probe, err := ffprobe(temp.Name())
	if err != nil {
		return nil, err
	}

	// restore orig filename
	probe.Format.Filename = file.Filename
	return probe, nil
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
