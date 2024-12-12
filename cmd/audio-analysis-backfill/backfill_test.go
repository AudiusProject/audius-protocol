package main

import (
	"context"
	"fmt"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/mediorum/server"
	"github.com/google/uuid"
)

func TestSingleTrack(t *testing.T) {
	os.Setenv(IsProdEnvVar, "false")
	setEndpoint()

	ctx, cancel := context.WithCancel(context.Background())
	var wg sync.WaitGroup

	wg.Add(2)

	go consumeUploadBatches(ctx, &wg)
	go consumeAnalysisResults(ctx, &wg)

	// manually send batch to process
	analyzeBatchQueueChan <- []string{
		"01JD8DKANJF4RVXY83RPDVBPX3"}
	close(analyzeBatchQueueChan)

	go func() {
		<-time.After(5 * time.Minute)
		cancel()
	}()

	wg.Wait()
}

func TestWriteFile(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())

	var wg sync.WaitGroup
	wg.Add(1)

	go consumeAnalysisResults(ctx, &wg)

	analyzeSuccessChan <- &server.Upload{
		ID: fmt.Sprintf("test-%s", uuid.NewString()),
		AudioAnalysisResults: &server.AudioAnalysisResult{
			BPM: 79.4,
			Key: "g major",
		},
	}

	analyzeSuccessChan <- &server.Upload{
		ID: fmt.Sprintf("test-%s", uuid.NewString()),
		AudioAnalysisResults: &server.AudioAnalysisResult{
			BPM: 116.1,
			Key: "b major",
		},
	}

	analyzeSuccessChan <- &server.Upload{
		ID: fmt.Sprintf("test-%s", uuid.NewString()),
		AudioAnalysisResults: &server.AudioAnalysisResult{
			BPM: 95,
			Key: "f major",
		},
	}

	time.Sleep(2 * time.Second)
	cancel()
	wg.Wait()
}
