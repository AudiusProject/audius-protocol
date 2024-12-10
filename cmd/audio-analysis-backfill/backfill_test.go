package main

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/mediorum/server"
	"github.com/google/uuid"
)

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
