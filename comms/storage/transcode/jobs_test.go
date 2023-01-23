package transcode

import (
	"log"
	"os"
	"testing"

	"comms.audius.co/discovery/jetstream"
	"github.com/nats-io/nats.go"
	"github.com/stretchr/testify/assert"
)

func TestMain(m *testing.M) {

	// connect to NATS and create JetStream Context
	nc, err := nats.Connect(nats.DefaultURL)
	if err != nil {
		log.Fatal(err)
	}
	js, err := nc.JetStream(nats.PublishAsyncMaxPending(256))
	if err != nil {
		log.Fatal(err)
	}
	jetstream.SetJetstreamContext(js)

	// run tests
	code := m.Run()

	// teardown
	nc.Close()

	os.Exit(code)
}

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
