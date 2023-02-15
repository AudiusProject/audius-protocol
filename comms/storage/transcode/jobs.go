package transcode

import (
	"bufio"
	"crypto/sha1"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"mime/multipart"
	"net"
	"os"
	"os/exec"
	"sort"
	"sync"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/storage/telemetry"
	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
	"github.com/lucsky/cuid"
	"github.com/nats-io/nats.go"
	"github.com/rs/zerolog"
	"github.com/spf13/cast"
)

type JobStatus string

const (
	JobStatusPending    JobStatus = "pending"
	JobStatusInProgress JobStatus = "in progress"
	JobStatusDone       JobStatus = "done"
	JobStatusError      JobStatus = "error"
)

type JobTemplate string

const (
	JobTemplateAudio       JobTemplate = "audio"
	JobTemplateImgSquare   JobTemplate = "img_square"
	JobTemplateImgBackdrop JobTemplate = "img_backdrop"
)

type Job struct {
	ID                string             `json:"id"`
	Template          JobTemplate        `json:"template"`
	Status            JobStatus          `json:"status"`
	CreatedAt         *time.Time         `json:"created_at,omitempty"`
	StartedAt         *time.Time         `json:"started_at,omitempty"`
	FinishedAt        *time.Time         `json:"finished_at,omitempty"`
	TranscodeProgress float64            `json:"transcode_progress,omitempty"`
	Error             string             `json:"error,omitempty"`
	Probe             *FFProbeResult     `json:"probe,omitempty"`
	SourceInfo        *nats.ObjectInfo   `json:"source_info,omitempty"`
	ResultInfo        *nats.ObjectInfo   `json:"result_info,omitempty"` // deprecated: use Results
	Results           []*nats.ObjectInfo `json:"results,omitempty"`
	TransocdeWorkerID string             `json:"transcode_worker_id,omitempty"`
	JetstreamSequence int                `json:"jetstream_sequence,omitempty"`
}

type JobsManager struct {
	jsc nats.JetStreamContext

	kv        nats.KeyValue
	watcher   nats.KeyWatcher
	table     map[string]*Job
	isCurrent bool
	logger    zerolog.Logger

	workSubscription *nats.Subscription
	tempBucketCount  int
	replicaCount     int

	websockets map[net.Conn]bool

	mu sync.RWMutex
}

const (
	KvSuffix                         = "_kv"
	temporaryObjectStoreNameTemplate = "temp_obj_%d" // if we adjust temporary settings (count, ttl, replication, placement) we should change this template to "roll forward"... delete the old ones later
	temporaryObjectStoreTTL          = time.Hour * 24
)

func NewJobsManager(jsc nats.JetStreamContext, prefix string, replicaCount int) (*JobsManager, error) {
	// kv
	kvBucketName := prefix + KvSuffix
	kv, err := jsc.CreateKeyValue(&nats.KeyValueConfig{
		Bucket:   kvBucketName,
		Replicas: replicaCount,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create KV: %v", err)
	}

	// work subscription using kv's underlying stream
	kvStreamName := "KV_" + kvBucketName
	workSubscription, err := jsc.QueueSubscribeSync("", kvStreamName, nats.AckWait(time.Minute), nats.BindStream(kvStreamName))
	if err != nil {
		return nil, fmt.Errorf("failed to create KV work subscription: %v", err)
	}

	watcher, err := kv.WatchAll()
	if err != nil {
		return nil, fmt.Errorf("failed to watch KV: %v", err)
	}

	jobman := &JobsManager{
		workSubscription: workSubscription,
		jsc:              jsc,
		kv:               kv,
		watcher:          watcher,
		table:            map[string]*Job{},
		logger:           telemetry.NewConsoleLogger(),
		tempBucketCount:  8,
		replicaCount:     replicaCount,
		websockets:       map[net.Conn]bool{},
	}

	jobman.createTemporaryObjectStores()

	go jobman.watch()

	return jobman, nil
}

func (jobman *JobsManager) createTemporaryObjectStores() {
	for i := 0; i < jobman.tempBucketCount; i++ {
		createObjStoreIfNotExists(&nats.ObjectStoreConfig{
			Bucket:   jobman.temporaryObjectStoreName(i),
			TTL:      temporaryObjectStoreTTL,
			Replicas: jobman.replicaCount,
			Placement: &nats.Placement{
				Cluster: config.NatsClusterName,
			},
		}, jobman.jsc)
	}
}

func (jobman *JobsManager) temporaryObjectStoreName(i int) string {
	return fmt.Sprintf(temporaryObjectStoreNameTemplate, i)
}

func (jobman *JobsManager) randomTemporaryObjectStore() (nats.ObjectStore, error) {
	name := jobman.temporaryObjectStoreName(rand.Intn(jobman.tempBucketCount))
	return jobman.jsc.ObjectStore(name)
}

func (jobman *JobsManager) watch() {
	for change := range jobman.watcher.Updates() {
		if change == nil {
			jobman.isCurrent = true
			continue
		}

		// read value
		var job *Job
		err := json.Unmarshal(change.Value(), &job)
		if err != nil {
			jobman.logger.Warn().Msg("invalid kv value: " + string(change.Value()))
			continue
		}

		// update table
		jobman.putInTable(job)

		// notify listeners
		if jobman.isCurrent {
			for conn := range jobman.websockets {
				jobman.websocketSend(conn, change.Value())
			}
		}

	}
}

func (jobman *JobsManager) Add(template JobTemplate, upload *multipart.FileHeader) (*Job, error) {
	f, err := upload.Open()
	if err != nil {
		return nil, err
	}
	defer f.Close()

	// fileHash, err := hashFile(f)
	// if err != nil {
	// 	return nil, err
	// }

	f.Seek(0, 0)

	// TEMP: separate id for every updload
	// in future we'll use fileHash from above for content address of input files
	// but for now I want to be able to re-upload + process same files repeatedly for easy testing
	fileHash := cuid.New()

	// put in bucket
	meta := &nats.ObjectMeta{
		Name:        fileHash,
		Description: upload.Filename,
	}

	objStore, err := jobman.randomTemporaryObjectStore()
	if err != nil {
		return nil, err
	}
	info, err := objStore.Put(meta, f)
	if err != nil {
		return nil, fmt.Errorf("failed to put object: %v", err)
	}

	job := &Job{
		ID:        fileHash,
		Template:  template,
		Status:    JobStatusPending,
		CreatedAt: timeNowPtr(),

		SourceInfo: info,
		Results:    []*nats.ObjectInfo{},
	}
	err = jobman.Update(job)
	if err != nil {
		return nil, err
	}

	return job, nil
}

func hashFile(r io.Reader) (string, error) {
	h := sha1.New()
	if _, err := io.Copy(h, r); err != nil {
		return "", err
	}
	fileHash := fmt.Sprintf("%x", h.Sum(nil))
	return fileHash, nil
}

func (jobman *JobsManager) Update(job *Job) error {
	d, err := json.Marshal(job)
	if err != nil {
		return err
	}

	_, err = jobman.kv.Put(job.ID, d)
	if err != nil {
		return err
	}

	// update in table too
	jobman.putInTable(job)

	return nil
}

func (jobman *JobsManager) putInTable(job *Job) {
	jobman.mu.Lock()
	jobman.table[job.ID] = job
	jobman.mu.Unlock()
}

func (jobman *JobsManager) Get(id string) *Job {
	jobman.mu.RLock()
	defer jobman.mu.RUnlock()
	return jobman.table[id]
}

func (jobman *JobsManager) GetObject(bucket, key string) (nats.ObjectResult, error) {
	objStore, err := jobman.jsc.ObjectStore(bucket)
	if err != nil {
		return nil, err
	}
	return objStore.Get(key)
}

func (jobman *JobsManager) RegisterWebsocket(conn net.Conn) {
	jobman.mu.Lock()
	jobman.websockets[conn] = true
	jobman.mu.Unlock()

	jobs := jobman.List()
	payload, _ := json.Marshal(jobs)
	jobman.websocketSend(conn, payload)
}

func (jobman *JobsManager) websocketSend(conn net.Conn, payload []byte) {
	err := wsutil.WriteServerMessage(conn, ws.OpText, payload)
	if err != nil {
		// if write fails, remove this conn
		jobman.logger.Debug().Msg("removing conn " + err.Error())
		jobman.mu.Lock()
		delete(jobman.websockets, conn)
		jobman.mu.Unlock()
	}
}

func (jobman *JobsManager) List() []*Job {
	jobman.mu.RLock()
	defer jobman.mu.RUnlock()

	jobs := make([]*Job, 0, len(jobman.table))
	for _, j := range jobman.table {
		jobs = append(jobs, j)
	}

	// sort reverse cronological
	sort.Slice(jobs, func(i, j int) bool {
		return jobs[j].CreatedAt.Before(*jobs[i].CreatedAt)
	})

	return jobs
}

func (jobman *JobsManager) StartWorkers(count int) {
	for i := 0; i < count; i++ {
		go jobman.startWorker(i)
	}
}

func (jobman *JobsManager) processJob(msg *nats.Msg, job *Job) error {
	logger := jobman.logger.With().Str("job", job.ID).Logger()
	objStore, err := jobman.jsc.ObjectStore(job.SourceInfo.Bucket)
	if err != nil {
		return err
	}

	onError := func(err error) error {
		logger.Warn().Msg("job error: " + err.Error())
		job.Error = err.Error()
		job.Status = JobStatusError
		jobman.Update(job)
		return err
	}

	logger.Debug().Str("job data", string(msg.Data)).Msg("starting job")

	job.Status = JobStatusInProgress
	job.StartedAt = timeNowPtr()

	// tmp files
	srcPath := "/tmp/inp_" + job.ID
	destPath := "/tmp/out_" + job.ID

	// remove any priors before starting just in case
	os.Remove(srcPath)
	os.Remove(destPath)

	// cleanup when done
	defer os.Remove(srcPath)
	defer os.Remove(destPath)

	err = objStore.GetFile(job.ID, srcPath)
	if err != nil {
		return onError(err)
	}

	// ffprobe: get some info about input file
	// esp. length for transocde progress
	// maybe skip transcode if it's a 192kbps mp3
	job.Probe, err = ffprobe(srcPath)
	if err != nil {
		logger.Warn().Msg("ffprobe error: " + err.Error())
	} else {
		jobman.Update(job)
	}

	switch job.Template {
	case JobTemplateImgSquare:
		// 150x150, 480x480, 1000x1000
		squares := []int{150, 480, 1000}
		srcReader, err := os.Open(srcPath)
		if err != nil {
			return onError(err)
		}
		for _, targetBox := range squares {
			srcReader.Seek(0, 0)
			out, w, h := Resized(".jpg", srcReader, targetBox, targetBox, "fill")
			logger.Debug().Int("targetBox", targetBox).Int("w", w).Int("h", h).Msg("resized")
			outName := fmt.Sprintf("%s_%d.jpg", job.ID, targetBox)
			info, err := objStore.Put(&nats.ObjectMeta{
				Name:        outName,
				Description: fmt.Sprintf("%dx%[1]d", targetBox),
			}, out)
			if err != nil {
				return onError(err)
			}
			job.Results = append(job.Results, info)
		}
	case JobTemplateImgBackdrop:
		// 640x, 2000x
		widths := []int{640, 2000}
		srcReader, err := os.Open(srcPath)
		if err != nil {
			return onError(err)
		}
		for _, targetWidth := range widths {
			srcReader.Seek(0, 0)
			out, w, h := Resized(".jpg", srcReader, targetWidth, AUTO, "fill")
			logger.Debug().Int("targetWidth", targetWidth).Int("w", w).Int("h", h).Msg("resized")
			outName := fmt.Sprintf("%s_%d.jpg", job.ID, targetWidth)
			info, err := objStore.Put(&nats.ObjectMeta{
				Name:        outName,
				Description: fmt.Sprintf("%dx", targetWidth),
			}, out)
			if err != nil {
				return onError(err)
			}
			job.Results = append(job.Results, info)
		}

	case JobTemplateAudio, "":
		if job.Template == "" {
			logger.Warn().Msg("empty template, falling back to audio")
		}

		cmd := exec.Command("ffmpeg",
			"-y",
			"-i", srcPath,
			"-b:a", "320k",
			"-f", "mp3",
			"-progress", "pipe:2",
			destPath)

		cmd.Stdout = os.Stdout

		// read ffmpeg progress
		stderr, err := cmd.StderrPipe()
		if err != nil {
			logger.Warn().Err(err)
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
						jobman.Update(job)
					}

					// tell server we're still on it
					msg.InProgress()
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

		// put result
		info, err := objStore.Put(&nats.ObjectMeta{
			Name:        job.ID + "_320.mp3",
			Description: "320kbps",
		}, dest)
		if err != nil {
			return onError(err)
		}

		job.Results = append(job.Results, info)
	}

	job.TranscodeProgress = 1
	job.FinishedAt = timeNowPtr()
	job.Status = JobStatusDone
	jobman.Update(job)

	return nil
}

func (jobman *JobsManager) startWorker(workerNumber int) {
	workerId := fmt.Sprintf("%s_%d", os.Getenv("NAME"), workerNumber)

	logger := jobman.logger.With().Str("worker", workerId).Logger()
	sub := jobman.workSubscription

	for {
		msg, err := sub.NextMsg(2 * time.Second)
		if err == nats.ErrTimeout {
			continue
		}
		if err != nil {
			logger.Warn().Err(err)
			continue
		}

		var job *Job
		err = json.Unmarshal(msg.Data, &job)
		if err != nil {
			fmt.Println("invalid job json", string(msg.Data), err)
			msg.Ack()
			continue
		}

		// Only process pending jobs
		if job.Status != JobStatusPending {
			msg.Ack()
			continue
		}

		job.TransocdeWorkerID = workerId
		meta, _ := msg.Metadata()
		job.JetstreamSequence = int(meta.Sequence.Stream)

		jobman.processJob(msg, job)
		msg.Ack()
	}
}

func timeNowPtr() *time.Time {
	now := time.Now()
	return &now
}
