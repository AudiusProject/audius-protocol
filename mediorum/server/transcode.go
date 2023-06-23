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
	"mediorum/crudr"
	"mime/multipart"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/disintegration/imaging"
	"github.com/spf13/cast"
	"golang.org/x/exp/slices"
)

func (ss *MediorumServer) startTranscoder() {
	myHost := ss.Config.Self.Host
	work := make(chan *Upload)
	numWorkers := 2

	// on boot... reset any of my wip jobs
	tx := ss.crud.DB.Model(Upload{}).
		Where(Upload{
			TranscodedBy: myHost,
			Status:       JobStatusBusy,
		}).
		Updates(Upload{Status: JobStatusNew})
	if tx.Error != nil {
		ss.logger.Warn("reset stuck uploads error" + tx.Error.Error())
	} else if tx.RowsAffected > 0 {
		ss.logger.Info("reset stuck uploads", "count", tx.RowsAffected)
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

	// start workers
	for i := 0; i < numWorkers; i++ {
		go ss.startTranscodeWorker(i, work)
	}

	// finally... poll periodically for uploads that slipped thru the cracks
	for {
		uploads := []*Upload{}
		ss.crud.DB.Where("status in ?", []string{JobStatusNew, JobStatusBusy}).Find(&uploads)

		for _, upload := range uploads {
			myIdx := slices.Index(upload.Mirrors, myHost)
			if myIdx == -1 {
				continue
			}

			// normally this job of mine would start via callback
			// but just in case we could enqueue it here.
			// there's a chance it would be processed twice if the callback and this loop
			// ran at the same instant...
			// but I'm not too worried about that race condition
			myRank := myIdx + 1
			if myRank == 1 && upload.Status == JobStatusNew {
				ss.logger.Info("my upload not started", "id", upload.ID, "my_rank", myRank)
				work <- upload
				continue
			}

			// determine if #1 rank worker dropped ball
			timedOut := false
			neverStarted := false

			// for #2 rank worker:
			if myRank == 2 {
				// no recent update?
				timedOut = upload.Status == JobStatusBusy &&
					time.Since(upload.TranscodedAt) > time.Minute

				// never started?
				neverStarted = upload.Status == JobStatusNew &&
					time.Since(upload.CreatedAt) > time.Minute*2
			}

			// for #3 rank worker:
			if myRank == 3 {
				// no recent update?
				timedOut = upload.Status == JobStatusBusy &&
					time.Since(upload.TranscodedAt) > time.Minute*5

				// never started?
				neverStarted = upload.Status == JobStatusNew &&
					time.Since(upload.CreatedAt) > time.Minute*5
			}

			if timedOut {
				ss.logger.Info("upload timed out... starting", "id", upload.ID, "my_rank", myRank)
				work <- upload
			} else if neverStarted {
				ss.logger.Info("upload never started", "id", upload.ID, "my_rank", myRank)
				work <- upload
			}
		}

		time.Sleep(time.Minute)
	}
}

func (ss *MediorumServer) startTranscodeWorker(n int, work chan *Upload) {
	for upload := range work {
		ss.logger.Debug("transcoding", "upload", upload.ID)
		err := ss.transcode(upload)
		if err != nil {
			ss.logger.Warn("transocde failed", "upload", upload, "err", err)
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
	JobStatusBusy  = "busy"
	JobStatusDone  = "done"
	JobStatusError = "error"
)

func (ss *MediorumServer) getKeyToTempFile(fileHash string) (*os.File, error) {
	temp, err := os.CreateTemp("", fileHash)
	if err != nil {
		return nil, err
	}

	blob, err := ss.bucket.NewReader(context.Background(), fileHash, nil)
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

func (ss *MediorumServer) transcode(upload *Upload) error {
	upload.TranscodedBy = ss.Config.Self.Host
	upload.TranscodedAt = time.Now().UTC()
	upload.Status = JobStatusBusy
	ss.crud.Update(upload)

	fileHash := upload.OrigFileCID
	logger := ss.logger.With("template", upload.Template, "cid", fileHash)

	onError := func(err error, info ...string) error {
		errMsg := fmt.Errorf("%s %s", err, strings.Join(info, " "))
		upload.Error = errMsg.Error()
		upload.Status = JobStatusError
		ss.crud.Update(upload)
		logger.Error("transcode error", err)
		return errMsg
	}

	temp, err := ss.getKeyToTempFile(fileHash)
	if err != nil {
		return onError(err, "getting file")
	}
	defer temp.Close()

	switch JobTemplate(upload.Template) {
	case JobTemplateImgSquare:
		// 150x150, 480x480, 1000x1000
		squares := []int{150, 480, 1000}
		for _, targetBox := range squares {
			temp.Seek(0, 0)
			out, w, h := Resized(".jpg", temp, targetBox, targetBox, "fill")
			resultHash, err := computeFileCID(out)
			if err != nil {
				return onError(err, "computeFileCID")
			}
			mirrors, err := ss.replicateFile(resultHash, out)
			if err != nil {
				return onError(err, "replicate")
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
			resultHash, err := computeFileCID(out)
			if err != nil {
				return onError(err, "computeFileCID")
			}
			mirrors, err := ss.replicateFile(resultHash, out)
			if err != nil {
				return onError(err, "replicate")
			}
			logger.Debug("did backdrop", "w", w, "h", h, "key", resultHash, "mirrors", mirrors)

			variantName := fmt.Sprintf("%dx.jpg", targetWidth)
			upload.TranscodeResults[variantName] = resultHash
		}

	case JobTemplateAudio, "":
		if upload.Template == "" {
			logger.Warn("empty template (shouldn't happen), falling back to audio")
		}

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

		cmd.Stdout = os.Stdout

		// read ffmpeg progress
		stderr, err := cmd.StderrPipe()
		if err != nil {
			fmt.Println("progress err", err)
		} else if upload.FFProbe != nil {
			durationSeconds := cast.ToFloat64(upload.FFProbe.Format.Duration)
			durationUs := durationSeconds * 1000 * 1000
			go func() {
				stderrLines := bufio.NewScanner(stderr)
				for stderrLines.Scan() {
					line := stderrLines.Text()
					var u float64
					fmt.Sscanf(line, "out_time_us=%f", &u)
					if u > 0 && durationUs > 0 {
						percent := u / durationUs
						// ss.logger.Debug("transcode", "file", fileHash, "progress", percent)
						upload.TranscodeProgress = percent
						upload.TranscodedAt = time.Now().UTC()
						ss.crud.Patch(upload)
					}
				}

			}()
		}

		err = cmd.Start()
		if err != nil {
			return onError(err)
		}

		err = cmd.Wait()
		if err != nil {
			return onError(err)
		}

		dest, err := os.Open(destPath)
		if err != nil {
			return onError(err)
		}
		defer dest.Close()

		// replicate to peers
		// attempt to forward to an assigned node
		resultHash, err := computeFileCID(dest)
		if err != nil {
			return onError(err, "computeFileCID")
		}
		resultKey := resultHash
		mirrors, err := ss.replicateFile(resultHash, dest)
		if err != nil {
			return onError(err)
		}

		upload.TranscodeResults["320"] = resultKey

		logger.Info("transcode done", "mirrors", mirrors)
	}

	upload.TranscodeProgress = 1
	upload.TranscodedAt = time.Now().UTC()
	upload.Status = "done"
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
	temp, err := os.CreateTemp("", "probe")
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
