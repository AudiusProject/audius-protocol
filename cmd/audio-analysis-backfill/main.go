package main

import (
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/mediorum/server"
	"github.com/go-resty/resty/v2"
)

// not actual go errors since the db record is a string
// bpm has a few more specific errors
const (
	Endpoint = "https://creatornode11.staging.audius.co"

	ErrParseBPM       = "failed to parse BPM from output"
	ErrParseStringBPM = "failed to parse formatted BPM string"
	ErrAnalyzeExit    = "command exited with status"
	ErrAnalyzeExec    = "failed to execute command"
)

var (
	SkippableErrors = []string{ErrParseBPM, ErrParseStringBPM}
	RetryableErrors = []string{ErrAnalyzeExit, ErrAnalyzeExec}

	analyzeBatchQueueChan = make(chan []string)
	analyzeSuccessChan    = make(chan *server.Upload)
)

func IsSkippable(err string) bool {
	for _, skippable := range SkippableErrors {
		if strings.Contains(err, skippable) {
			return true
		}
	}
	return false
}

func IsRetryable(err string) bool {
	for _, retryable := range RetryableErrors {
		if strings.Contains(err, retryable) {
			return true
		}
	}
	return false
}

// call uploads endpoint https://creatornode3.audius.co/uploads/{uploadID}
// get transcoded mirrors
// call ?analyze=true on one of the mirrors
// call uploads endpoint again to get new data
func reprocessAudioAnalysis(wg *sync.WaitGroup, r *resty.Client, uploadID string) error {
	defer wg.Done()

	uploadRes := &server.Upload{}
	_, err := r.R().SetResult(uploadRes).Get(fmt.Sprintf("%s/uploads/%s", Endpoint, uploadID))
	if err != nil {
		return err
	}

	// check if status is error
	if uploadRes.AudioAnalysisStatus != "error" {
		return nil
	}

	// check if the error is not recoverable (no BPM like a podcast)
	if IsSkippable(uploadRes.AudioAnalysisError) {
		return nil
	}

	// check if the error is not retryable
	if !IsRetryable(uploadRes.AudioAnalysisError) {
		return nil
	}

	// use node where file is supposed to be stored
	endpoint := uploadRes.TranscodedMirrors[0]

	// re-analyze the track
	analyzeRes := &server.Upload{}
	_, err = r.R().SetResult(analyzeRes).SetQueryParam("analyze", "true").Get(fmt.Sprintf("%s/uploads/%s", endpoint, uploadID))
	if err != nil {
		return err
	}

	analyzeSuccessChan <- analyzeRes

	return nil
}

func consumeUploadBatches(wg *sync.WaitGroup) {
	defer wg.Done()

	client := resty.New()

	for ulidBatch := range analyzeBatchQueueChan {
		var bwg sync.WaitGroup

		bwg.Add(len(ulidBatch))
		for _, ulid := range ulidBatch {
			go reprocessAudioAnalysis(&bwg, client, ulid)
		}

		bwg.Wait()
	}
}

func consumeAnalysisResults(wg *sync.WaitGroup) {
	defer wg.Done()

	now := time.Now().UTC().Second()
	filename := fmt.Sprintf("./output/%d_audio_analysis_backfill.sql", now)

	// write .sql file
	file, err := os.Create(filename)
	if err != nil {
		fmt.Println("error creating file:", err)
		return
	}
	defer file.Close()

	// write "begin;"
	file.WriteString("begin;")
	defer file.WriteString("commit;")

	for upload := range analyzeSuccessChan {
		line := fmt.Sprintf("update tracks set bpm = %d, musical_key = '%s' where audio_upload_id = '%s';", &upload.AudioAnalysisResults.BPM, upload.AudioAnalysisResults.Key, upload.ID)
		file.WriteString(line)
	}
}

func main() {
	var wg sync.WaitGroup

	wg.Add(2)

	go consumeUploadBatches(&wg)
	go consumeAnalysisResults(&wg)

	wg.Wait()
}
