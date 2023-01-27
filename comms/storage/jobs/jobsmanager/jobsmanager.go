// Package jobsmanager manages workers for running audio transcode and image resize jobs.
package jobsmanager

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"comms.audius.co/storage/jobs"
	"comms.audius.co/storage/jobs/jobsmonitor"
	"comms.audius.co/storage/jobs/jobsutil"
	"comms.audius.co/storage/storageutil"
	"github.com/inconshreveable/log15"
	"github.com/nats-io/nats.go"
)

const (
	tempObjStoreSuffix = "temp-job-files"
	tempObjStoreTtl    = time.Hour * 24 * 7
	kvSuffix           = "jobs-kv"
)

type JobsManager interface {
	// SaveJob updates the job in KV. If its status is pending, then it will be processed by a worker.
	SaveJob(job jobs.Job) error
	// GetTempObjStore returns the bucket where jobs' temp files are stored (e.g., raw audio for transcoding).
	GetTempObjStore() nats.ObjectStore
	// GetMonitor returns an interface for monitoring job info, including their progress.
	GetMonitor() jobsmonitor.JobsMonitor
}

type jobsManager struct {
	namespace        string
	monitor          jobsmonitor.JobsMonitor
	tempObjStore     nats.ObjectStore
	jsc              nats.JetStreamContext
	logger           log15.Logger
	workSubscription *nats.Subscription
	kv               nats.KeyValue
}

// New creates a new JobsManager in the given namespace with numWorkers workers each processing jobs in parallel from a KV bucket backed by replicaCount nodes.
func New(namespace string, jsc nats.JetStreamContext, replicaCount int, numWorkers int) (*jobsManager, error) {
	// Create KV bucket (if not exists) to store jobs
	kvBucketName := fmt.Sprintf("%s_%s", namespace, kvSuffix)
	kv, err := jsc.KeyValue(kvBucketName)
	if err == nats.ErrBucketNotFound || err == nats.ErrStreamNotFound {
		kv, err = jsc.CreateKeyValue(&nats.KeyValueConfig{
			Bucket:      kvBucketName,
			Description: "Stores job info including status, progress, and results",
			// TODO: Might want to configure other properties like max size
		})
		if err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}

	// Create stream subscription to process pending jobs
	kvStreamName := "KV_" + kvBucketName
	workSubscription, err := jsc.QueueSubscribeSync("", kvStreamName, nats.AckWait(time.Minute), nats.BindStream(kvStreamName))
	if err != nil {
		return nil, err
	}

	watcher, err := kv.WatchAll()
	if err != nil {
		return nil, err
	}

	// Create object store bucket (if not exists) for uploads that have yet to be processed
	objStoreBucketName := fmt.Sprintf("%s_%s", namespace, tempObjStoreSuffix)
	tempObjStore, err := jsc.ObjectStore(kvBucketName)
	if err == nats.ErrBucketNotFound || err == nats.ErrStreamNotFound {
		tempObjStore, err = jsc.CreateObjectStore(&nats.ObjectStoreConfig{
			Bucket: objStoreBucketName,
			TTL:    tempObjStoreTtl,
			// TODO: Might want to configure other properties like max size
		})
		if err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}

	logger := log15.New()
	jobsMan := &jobsManager{
		namespace:        namespace,
		monitor:          jobsmonitor.New(tempObjStore, watcher, logger),
		tempObjStore:     tempObjStore,
		jsc:              jsc,
		logger:           logger,
		workSubscription: workSubscription,
		kv:               kv,
	}

	// Start workers to process jobs
	for i := 0; i < numWorkers; i++ {
		go jobsMan.startWorker(i)
	}

	return jobsMan, nil
}

func (jobsMan *jobsManager) GetTempObjStore() nats.ObjectStore {
	return jobsMan.tempObjStore
}

func (jobsMan *jobsManager) startWorker(workerNumber int) {
	workerId := fmt.Sprintf("%s_%d", os.Getenv("NAME"), workerNumber)

	logger := jobsMan.logger.New("worker", workerId)
	sub := jobsMan.workSubscription

	for {
		msg, err := sub.NextMsg(2 * time.Second)
		if err == nats.ErrTimeout {
			continue
		}
		if err != nil {
			logger.Warn(err.Error())
			continue
		}

		job, err := jobsutil.UnmarshalJobFromJson(msg.Data)
		if err != nil {
			fmt.Println("Invalid job json", string(msg.Data), err)
			msg.Ack()
			continue
		}

		// Only process pending jobs
		if job.GetStatus() != jobs.JobStatusPending {
			msg.Ack()
			continue
		}

		// Set job start data
		job.SetWorkerID(workerId)
		job.SetStatus(jobs.JobStatusInProgress)
		job.SetStartedAt(storageutil.TimeNowPtr())
		jobsMan.SaveJob(job)
		meta, _ := msg.Metadata()
		job.SetJetstreamSequence(int(meta.Sequence.Stream))

		// Process the job
		logger := jobsMan.logger.New("job", job.GetID())
		logger.Debug("starting job", "job", string(msg.Data))
		err = job.Process(msg, logger, jobsMan.GetTempObjStore(), jobsMan.SaveJob)

		// Set job end data and handle errors
		if err != nil {
			logger.Warn("job error: " + err.Error())
			job.SetError(err.Error())
			job.SetStatus(jobs.JobStatusError)
		} else {
			job.SetFinishedAt(storageutil.TimeNowPtr())
			job.SetStatus(jobs.JobStatusDone)
		}
		jobsMan.SaveJob(job)

		msg.Ack()
	}
}

func (jobsMan *jobsManager) GetMonitor() jobsmonitor.JobsMonitor {
	return jobsMan.monitor
}

func (jobsMan *jobsManager) SaveJob(job jobs.Job) error {
	jobJson, err := json.Marshal(job)
	if err != nil {
		return err
	}

	_, err = jobsMan.kv.Put(job.GetID(), jobJson)
	if err != nil {
		return err
	}

	// Update in job monitoring table too
	jobsMan.monitor.PutInTable(job)
	return nil
}
