// Package jobsmanager manages workers for running audio transcode and image resize jobs.
package jobsmanager

import (
	"log"
	"os"
	"testing"
	"time"

	"comms.audius.co/discovery/jetstream"
	"comms.audius.co/storage/jobs"
	"github.com/nats-io/nats.go"
	"github.com/stretchr/testify/assert"
)

func TestMain(m *testing.M) {
	// Connect to NATS and create JetStream Context
	nc, err := nats.Connect(nats.DefaultURL)
	if err != nil {
		log.Fatal(err)
	}
	js, err := nc.JetStream(nats.PublishAsyncMaxPending(256))
	if err != nil {
		log.Fatal(err)
	}
	jetstream.SetJetstreamContext(js)

	// Run tests
	code := m.Run()

	// Teardown
	nc.Close()

	os.Exit(code)
}

func TestJobManager(t *testing.T) {
	assert := assert.New(t)
	nc, err := nats.Connect(nats.DefaultURL)
	assert.NoError(err)

	jsc, err := nc.JetStream()
	assert.NoError(err)

	// Open audio file that can be transcoded successfully
	testAudioFile, err := os.Open("test.mp3")
	assert.NoError(err)
	defer testAudioFile.Close()

	// Make and open non-audio file that will error when transcoded
	testNonAudioFile, err := os.Open("test.txt")
	assert.NoError(err)
	defer testAudioFile.Close()

	testCases := map[string]struct {
		numWorkers     int
		file           *os.File
		expectedStatus jobs.JobStatus
	}{
		"transcode jobs with valid audio file succeed when numWorkers=3": {
			numWorkers:     3,
			file:           testAudioFile,
			expectedStatus: jobs.JobStatusDone,
		},
		"transcode jobs with non-audio file error when numWorkers=3": {
			numWorkers:     3,
			file:           testNonAudioFile,
			expectedStatus: jobs.JobStatusError,
		},
		"transcode jobs with non-audio file remain in pending when numWorkers=0": {
			numWorkers:     0,
			file:           testNonAudioFile,
			expectedStatus: jobs.JobStatusPending,
		},
	}

	for testName, testCase := range testCases {
		t.Logf("Running test case %q", testName)

		// Clear the KV and object stores
		err = jsc.DeleteKeyValue("testing_" + kvSuffix)
		assert.NoError(err)
		jsc.DeleteObjectStore("testing_" + tempObjStoreSuffix)
		assert.NoError(err)

		// Create jobs manager and 2 jobs
		jobsManager, err := New("testing", jsc, 1, testCase.numWorkers)
		assert.NoError(err)
		job1, err := jobs.NewTranscodeJob(testCase.file, jobsManager.GetTempObjStore())
		assert.NoError(err)
		job2, err := jobs.NewTranscodeJob(testCase.file, jobsManager.GetTempObjStore())
		assert.NoError(err)

		// Add jobs to monitor
		assert.Len(jobsManager.GetMonitor().List(), 0)
		jobsManager.GetMonitor().PutInTable(job1)
		jobsManager.GetMonitor().PutInTable(job2)
		assert.Len(jobsManager.GetMonitor().List(), 2)

		// Assert that monitor sees jobs as pending
		assert.Equal(jobs.JobStatusPending, jobsManager.GetMonitor().GetJob(job1.GetID()).GetStatus())
		assert.Equal(jobs.JobStatusPending, jobsManager.GetMonitor().GetJob(job2.GetID()).GetStatus())

		// Save jobs to KV store and wait 300ms for workers to process them
		jobsManager.SaveJob(job1)
		jobsManager.SaveJob(job2)
		time.Sleep(300 * time.Millisecond)

		// Assert that jobs were processed with expected completion status
		assert.Equal(testCase.expectedStatus, jobsManager.GetMonitor().GetJob(job1.GetID()).GetStatus())
		assert.Equal(testCase.expectedStatus, jobsManager.GetMonitor().GetJob(job2.GetID()).GetStatus())
	}
}
