package transcode

import (
	"testing"

	"github.com/nats-io/nats.go"
	"github.com/stretchr/testify/assert"
)

func TestJobManager(t *testing.T) {

	nc, err := nats.Connect(nats.DefaultURL)
	assert.NoError(t, err)

	jsc, err := nc.JetStream()
	assert.NoError(t, err)

	jobm, err := NewJobsManager(jsc, "testing", 1)
	assert.NoError(t, err)

	jobm.Update(&Job{
		ID:        "1",
		Status:    JobStatusError,
		CreatedAt: timeNowPtr(),
	})

	jobm.Update(&Job{
		ID:        "2",
		Status:    JobStatusInProgress,
		CreatedAt: timeNowPtr(),
	})

	j1 := jobm.Get("1")
	assert.Equal(t, JobStatusError, j1.Status)
	j2 := jobm.Get("2")
	assert.Equal(t, JobStatusInProgress, j2.Status)

	jobs := jobm.List()
	assert.Len(t, jobs, 2)
	assert.Equal(t, "2", jobs[0].ID)
	assert.Equal(t, "1", jobs[1].ID)
}
