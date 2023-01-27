// Package jobs defines types and processing logic for jobs done in response to a queue, including image resizing and audio transcoding.
package jobs

import (
	"time"

	"github.com/inconshreveable/log15"
	"github.com/nats-io/nats.go"
)

type JobStatus string

const (
	JobStatusPending    JobStatus = "pending"
	JobStatusInProgress JobStatus = "in progress"
	JobStatusDone       JobStatus = "done"
	JobStatusError      JobStatus = "error"
)

type JobType string

const (
	JobTypeTranscode JobType = "transcode"
	JobTypeResize    JobType = "resize"
)

type Job interface {
	// Process is only called by JobsManager. To queue a job, use JobsManager.AddJob().
	Process(msg *nats.Msg, logger log15.Logger, objStore nats.ObjectStore, updateJob func(Job) error) error
	GetID() string
	GetCreatedAt() *time.Time
	GetStatus() JobStatus
	SetStatus(JobStatus)
	SetWorkerID(string)
	SetStartedAt(*time.Time)
	SetFinishedAt(*time.Time)
	SetJetstreamSequence(int)
	SetError(string)
}
