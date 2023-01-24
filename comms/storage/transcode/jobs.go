package transcode

import (
	"bufio"
	"crypto/sha1"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net"
	"os"
	"os/exec"
	"sort"
	"sync"
	"time"

	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
	"github.com/inconshreveable/log15"
	"github.com/lucsky/cuid"
	"github.com/nats-io/nats.go"
	"github.com/spf13/cast"
)

type Job struct {
	ID                string           `json:"id"`
	Status            string           `json:"status"`
	CreatedAt         *time.Time       `json:"created_at,omitempty"`
	StartedAt         *time.Time       `json:"started_at,omitempty"`
	FinishedAt        *time.Time       `json:"finished_at,omitempty"`
	TranscodeProgress float64          `json:"transcode_progress,omitempty"`
	Error             string           `json:"error,omitempty"`
	Probe             *FFProbeResult   `json:"probe,omitempty"`
	SourceInfo        *nats.ObjectInfo `json:"source_info,omitempty"`
	ResultInfo        *nats.ObjectInfo `json:"result_info,omitempty"`
	TransocdeWorkerID string           `json:"transcode_worker_id,omitempty"`
	JetstreamSequence int              `json:"jetstream_sequence,omitempty"`
}

type JobsManager struct {
	queueName string
	jsc       nats.JetStreamContext

	kv        nats.KeyValue
	watcher   nats.KeyWatcher
	table     map[string]*Job
	isCurrent bool
	logger    log15.Logger

	objStore         nats.ObjectStore
	workSubscription *nats.Subscription

	websockets map[net.Conn]bool

	mu sync.RWMutex
}

func NewJobsManager(jsc nats.JetStreamContext, prefix string, replicaCount int) (*JobsManager, error) {

	// work queue
	queueName := prefix + "_queue"
	_, err := jsc.AddStream(&nats.StreamConfig{
		Name:     queueName,
		Subjects: []string{queueName},
		Replicas: replicaCount,
	})
	if err != nil {
		return nil, err
	}

	// work subscription
	workSubscription, err := jsc.QueueSubscribeSync(queueName, queueName, nats.AckWait(time.Minute))
	if err != nil {
		return nil, err
	}

	// kv
	kv, err := jsc.CreateKeyValue(&nats.KeyValueConfig{
		Bucket:   prefix + "_kv",
		Replicas: replicaCount,
	})
	if err != nil {
		return nil, err
	}

	watcher, err := kv.WatchAll()
	if err != nil {
		return nil, err
	}

	// object store
	// todo: sharding
	objStore, err := jsc.CreateObjectStore(&nats.ObjectStoreConfig{
		Bucket: prefix + "_store",
		TTL:    time.Hour * 24 * 7,
	})
	if err != nil {
		return nil, err
	}

	jobman := &JobsManager{
		queueName:        queueName,
		workSubscription: workSubscription,
		objStore:         objStore,
		jsc:              jsc,
		kv:               kv,
		watcher:          watcher,
		table:            map[string]*Job{},
		logger:           log15.New(),
		websockets:       map[net.Conn]bool{},
	}

	go jobman.watch()

	return jobman, nil
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
			jobman.logger.Warn("invalid kv value: " + string(change.Value()))
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

func (jobman *JobsManager) Add(f multipart.File) (*Job, error) {

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
	// todo: sharding
	meta := &nats.ObjectMeta{
		Name: fileHash,
	}
	info, err := jobman.objStore.Put(meta, f)
	if err != nil {
		return nil, err
	}

	job := &Job{
		ID:        fileHash,
		Status:    "pending",
		CreatedAt: timeNowPtr(),

		SourceInfo: info,
	}
	err = jobman.put(job, true)
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
	return jobman.put(job, false)
}

func (jobman *JobsManager) put(job *Job, isNew bool) error {
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

	// if new add task to queue
	if isNew {
		_, err = jobman.jsc.Publish(jobman.queueName, d)
		if err != nil {
			return err
		}
	}

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
	// todo: sharding
	return jobman.objStore.Get(key)
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
		jobman.logger.Debug("removing conn " + err.Error())
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
	logger := jobman.logger.New("job", job.ID)
	objStore := jobman.objStore

	onError := func(err error) error {
		logger.Warn("job error: " + err.Error())
		job.Error = err.Error()
		job.Status = "error"
		jobman.Update(job)
		return err
	}

	logger.Debug("starting job", "job", string(msg.Data))

	job.Status = "in progress"
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

	err := objStore.GetFile(job.ID, srcPath)
	if err != nil {
		return onError(err)
	}

	// ffprobe: get some info about input file
	// esp. length for transocde progress
	// maybe skip transcode if it's a 192kbps mp3
	job.Probe, err = ffprobe(srcPath)
	if err != nil {
		logger.Warn("ffprobe error: " + err.Error())
	} else {
		jobman.Update(job)
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

	//
	// where to put result??
	// probably should go to some "destination" bucket
	// but for now just put in same ol bucket with a suffix
	//
	info, err := objStore.Put(&nats.ObjectMeta{Name: job.ID + "_320.mp3"}, dest)
	if err != nil {
		return onError(err)
	}

	job.FinishedAt = timeNowPtr()
	job.ResultInfo = info
	job.Status = "done"
	jobman.Update(job)

	return nil
}

func (jobman *JobsManager) startWorker(workerNumber int) {
	workerId := fmt.Sprintf("%s_%d", os.Getenv("NAME"), workerNumber)

	logger := jobman.logger.New("worker", workerId)
	sub := jobman.workSubscription

	for {
		msg, err := sub.NextMsg(2 * time.Second)
		if err == nats.ErrTimeout {
			continue
		}
		if err != nil {
			logger.Warn(err.Error())
			continue
		}

		var job *Job
		err = json.Unmarshal(msg.Data, &job)
		if err != nil {
			fmt.Println("invalid job json", string(msg.Data), err)
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
