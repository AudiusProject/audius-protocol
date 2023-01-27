// Package jobs defines types and processing logic for jobs done in response to a queue, including image resizing and audio transcoding.
package jobs

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"os/exec"
	"time"

	"comms.audius.co/storage/storageutil"
	"github.com/inconshreveable/log15"
	"github.com/lucsky/cuid"
	"github.com/nats-io/nats.go"
	"github.com/spf13/cast"
)

type TranscodeJob struct {
	Type              JobType          `json:"type"`
	ID                string           `json:"id"`
	Status            JobStatus        `json:"status"`
	CreatedAt         *time.Time       `json:"created_at,omitempty"`
	StartedAt         *time.Time       `json:"started_at,omitempty"`
	FinishedAt        *time.Time       `json:"finished_at,omitempty"`
	TranscodeProgress float64          `json:"transcode_progress,omitempty"`
	Error             string           `json:"error,omitempty"`
	Probe             *FFProbeResult   `json:"probe,omitempty"`
	SourceInfo        *nats.ObjectInfo `json:"source_info,omitempty"`
	ResultInfo        *nats.ObjectInfo `json:"result_info,omitempty"`
	WorkerID          string           `json:"worker_id,omitempty"`
	JetstreamSequence int              `json:"jetstream_sequence,omitempty"`
}

// NewTranscodeJob puts contents of File f in objStore to be transcoded later when the job is processed.
type ReaderSeeker interface {
	io.Reader
	io.Seeker
}

func NewTranscodeJob(file ReaderSeeker, objStore nats.ObjectStore) (*TranscodeJob, error) {
	// fileHash, err := hashFile(f)
	// if err != nil {
	// 	return nil, err
	// }

	file.Seek(0, 0)

	// TEMP: separate id for every upload
	// in future we'll use fileHash from above for content address of input files
	// but for now I want to be able to re-upload + process same files repeatedly for easy testing
	fileHash := cuid.New()
	id := fileHash

	// Put in temp bucket for later processing
	// TODO: sharding
	meta := &nats.ObjectMeta{
		Name: id,
	}
	info, err := objStore.Put(meta, file)
	if err != nil {
		return nil, err
	}

	job := &TranscodeJob{
		Type:       JobTypeTranscode,
		ID:         id,
		Status:     JobStatusPending,
		SourceInfo: info,
		CreatedAt:  storageutil.TimeNowPtr(),
	}
	return job, nil
}

func (job *TranscodeJob) Process(msg *nats.Msg, logger log15.Logger, objStore nats.ObjectStore, updateJob func(Job) error) error {
	// Temp files
	srcPath := "/tmp/inp_" + job.ID
	destPath := "/tmp/out_" + job.ID

	// Remove any prior file state before starting and clean up when done
	os.Remove(srcPath)
	os.Remove(destPath)
	defer os.Remove(srcPath)
	defer os.Remove(destPath)

	// Get raw audio file
	err := objStore.GetFile(job.ID, srcPath)
	if err != nil {
		return err
	}

	// ffprobe: get some info about input file
	// esp. length for transcode progress
	// maybe skip transcode if it's a 192kbps mp3
	job.Probe, err = ffprobe(srcPath)
	if err != nil {
		logger.Warn("ffprobe error: " + err.Error())
	} else {
		updateJob(job)
	}

	// Transcode raw audio file to 320kbps mp3
	cmd := exec.Command("ffmpeg",
		"-y",
		"-i", srcPath,
		"-b:a", "320k",
		"-f", "mp3",
		"-progress", "pipe:2",
		destPath)

	cmd.Stdout = os.Stdout

	// Read ffmpeg progress
	stderr, err := cmd.StderrPipe()
	if err != nil {
		logger.Warn(err.Error())
	} else if job.Probe != nil {
		durationSeconds := cast.ToFloat64(job.Probe.Format.Duration)
		durationUs := durationSeconds * 1000 * 1000
		go func() {
			stderrLines := bufio.NewScanner(stderr)
			for stderrLines.Scan() {
				line := stderrLines.Text()
				var u float64
				fmt.Sscanf(line, "out_time_us=%f", &u)
				if u > 0 && durationUs > 0 {
					percent := u / durationUs
					job.TranscodeProgress = percent
					updateJob(job)
				}

				// Tell server we're still on it
				msg.InProgress()
			}

		}()
	}

	err = cmd.Start()
	if err != nil {
		return err
	}
	err = cmd.Wait()
	if err != nil {
		return err
	}
	dest, err := os.Open(destPath)
	if err != nil {
		return err
	}

	// TODO: Sharding and use a different bucket for transcoded files
	info, err := objStore.Put(&nats.ObjectMeta{Name: job.ID + "_320.mp3"}, dest)
	if err != nil {
		return err
	}
	job.ResultInfo = info

	return nil
}

func (job *TranscodeJob) GetID() string {
	return job.ID
}

func (job *TranscodeJob) GetCreatedAt() *time.Time {
	return job.CreatedAt
}

func (job *TranscodeJob) GetStatus() JobStatus {
	return job.Status
}

func (job *TranscodeJob) SetStatus(status JobStatus) {
	job.Status = status
}

func (job *TranscodeJob) SetWorkerID(id string) {
	job.WorkerID = id
}

func (job *TranscodeJob) SetStartedAt(t *time.Time) {
	job.StartedAt = t
}

func (job *TranscodeJob) SetFinishedAt(t *time.Time) {
	job.FinishedAt = t
}

func (job *TranscodeJob) SetJetstreamSequence(seq int) {
	job.JetstreamSequence = seq
}

func (job *TranscodeJob) SetError(err string) {
	job.Error = err
}
