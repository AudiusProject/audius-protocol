package tests

import (
	"context"
	"testing"

	"comms.audius.co/shared/utils"
	"golang.org/x/exp/slices"
)

func TestAudioUpload(t *testing.T) {
	client, server, err := SpawnServer()
	if err != nil {
		t.Fatalf("failed to start server, %+v", err)
	}

	whitenoise, err := utils.GenerateWhiteNoise(300)
	if err != nil {
		t.Fatalf("failed to generate whitenoise, %+v", err)
	}

	err = client.UploadAudio(whitenoise, "test-upload.mp3")
	if err != nil {
		t.Fatalf("failed to upload whitenoise, %+v", err)
	}

	if err := server.WebServer.Shutdown(context.Background()); err != nil {
		t.Fatalf("failed to shutdown server, %+v", err)
	}
}

func TestPersistence(t *testing.T) {
	// spawn server
	client, server, err := SpawnServer()
	if err != nil {
		t.Fatalf("failed to start server, %+v", err)
	}

	jobsCount := 100

	// seed server
	client.SeedAudio(jobsCount)

	// check jobs
	jobs, err := client.GetJobs()
	if err != nil {
		t.Fatalf("failed to get jobs, %+v", err)
	}


	if len(jobs) != jobsCount {
		t.Fatalf("incorrect number of jobs, want=%d, got=%d", jobsCount, len(jobs))
	}

	// figure out which node each job's results should be stored on
	jobToNodes := map[string][]string{}
	for _, job := range jobs {
		nodes, err := client.GetStorageNodesFor(job.ID)
		if err != nil {
			jobToNodes[job.ID] = []string{}
			continue
		}

		jobToNodes[job.ID] = nodes
	}

	// make sure it's there
	for jobId, nodes := range jobToNodes {
		for _, node := range nodes {
			shard := jobId[len(jobId)-2:]
			keys, err := client.GetKeysByShard(shard)
			if err != nil {
				continue
			}

			if !slices.Contains(*keys, jobId) {
				t.Fatalf("jobId `%s` is missing from keysByShard on node %s", jobId, node)
			}
		}
	}


	// shutdown server
	if err := server.WebServer.Shutdown(context.Background()); err != nil {
		t.Fatalf("failed to shutdown server, %+v", err)
	}
}

