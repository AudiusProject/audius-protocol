package transcode

import (
	"testing"

	"comms.audius.co/shared/peering"
	"comms.audius.co/storage/config"
	"github.com/stretchr/testify/assert"
)

func TestJobManager(t *testing.T) {

	namespace := "testing_storage"
	p, err := peering.New(&config.GetStorageConfig().PeeringConfig)
	assert.NoError(t, err)

	nc, err := p.DialNats(nil)
	assert.NoError(t, err)

	jsc, err := nc.JetStream()
	assert.NoError(t, err)

	jobm, err := NewJobsManager(jsc, namespace)
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
