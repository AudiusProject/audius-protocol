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
		Status:    "new",
		CreatedAt: timeNowPtr(),
	})

	jobm.Update(&Job{
		ID:        "2",
		Status:    "new",
		CreatedAt: timeNowPtr(),
	})

	j := jobm.Get("1")
	assert.Equal(t, "new", j.Status)

	jobs := jobm.List()
	assert.Len(t, jobs, 2)
	assert.Equal(t, "2", jobs[0].ID)
	assert.Equal(t, "1", jobs[1].ID)
}
