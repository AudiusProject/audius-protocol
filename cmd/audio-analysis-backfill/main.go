package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/mediorum/server"
	"github.com/go-resty/resty/v2"
)

/*
stage examples:
https://creatornode11.staging.audius.co/uploads/01JD8DCN4K6AEK8JQM34R80BX4

prod examples:

*/

// not actual go errors since the db record is a string
// bpm has a few more specific errors
const (
	ErrParseBPM       = "failed to parse BPM from output"
	ErrParseStringBPM = "failed to parse formatted BPM string"
	ErrAnalyzeExit    = "command exited with status"
	ErrAnalyzeExec    = "failed to execute command"

	IsProdEnvVar = "isProd"
	BatchSize    = 20
	PostgresConn = "postgresql://postgres:postgres@0.0.0.0:5432/audius_creator_node"
)

var (
	Endpoint = ""

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
func reprocessAudioAnalysis(r *resty.Client, uploadID string) error {
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

func intakeUploadBatches(ctx context.Context, wg *sync.WaitGroup) {
	defer wg.Done()
	defer close(analyzeBatchQueueChan)

	db, err := sql.Open("postgres", PostgresConn)
	if err != nil {
		fmt.Println("couldn't connect to postgres:", err)
		return
	}
	defer db.Close()

	query := `select id from uploads where template = 'audio' and audio_analysis_status = 'error' and audio_analysis_error ilike 'command exited with status -1:%';`
	rows, err := db.Query(query)
	if err != nil {
		fmt.Println("couldn't query postgres:", err)
		return
	}
	defer rows.Close()

	allIds := []string{}
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			fmt.Println("couldn't scan row:", err)
		}
		allIds = append(allIds, id)
	}

	for {
		select {
		case <-ctx.Done():
			fmt.Println("intakeUploadBatches exiting due to context cancellation")
			return
		default:
			if len(allIds) == 0 {
				fmt.Println("All batches processed")
				return
			}

			// Determine the end of the current batch
			end := BatchSize
			if len(allIds) < BatchSize {
				end = len(allIds)
			}

			// Pop the batch from the array
			batch := allIds[:end]
			allIds = allIds[end:]

			// Process the batch
			analyzeBatchQueueChan <- batch
		}
	}
}

func consumeUploadBatches(ctx context.Context, wg *sync.WaitGroup) {
	defer wg.Done()
	defer close(analyzeSuccessChan)

	client := resty.New()

	for {
		select {
		case <-ctx.Done():
			fmt.Println("consumeUploadBatches exiting due to context cancellation")
			return
		case ulidBatch, ok := <-analyzeBatchQueueChan:
			if !ok {
				return
			}

			var bwg sync.WaitGroup
			bwg.Add(len(ulidBatch))

			for _, ulid := range ulidBatch {
				go func(ulid string) {
					defer bwg.Done()
					select {
					case <-ctx.Done():
						fmt.Printf("Stopping reprocessing for ULID: %s\n", ulid)
					default:
						reprocessAudioAnalysis(client, ulid)
					}
				}(ulid)
			}

			bwg.Wait()
		}
	}
}

func consumeAnalysisResults(ctx context.Context, wg *sync.WaitGroup) {
	defer wg.Done()

	now := time.Now().UTC().Unix()
	filename := fmt.Sprintf("./output/%d_audio_analysis_backfill.sql", now)

	// Write .sql file
	file, err := os.Create(filename)
	if err != nil {
		fmt.Println("error creating file:", err)
		return
	}
	defer file.Close()

	// Write "begin;" and end with "commit;"
	file.WriteString("begin;\n\n")
	defer file.WriteString("\ncommit;")

	for {
		select {
		case <-ctx.Done():
			fmt.Println("consumeAnalysisResults exiting due to context cancellation")
			return
		case upload, ok := <-analyzeSuccessChan:
			if !ok {
				return
			}

			line := fmt.Sprintf("update tracks set bpm = %g, musical_key = '%s' where audio_upload_id = '%s';\n",
				upload.AudioAnalysisResults.BPM, upload.AudioAnalysisResults.Key, upload.ID)
			if _, err := file.WriteString(line); err != nil {
				fmt.Println("error writing to file:", err)
				return
			}
		}
	}
}

func setEndpoint() {
	isProdVar := os.Getenv(IsProdEnvVar)
	isProd, err := strconv.ParseBool(isProdVar)
	if err != nil {
		isProd = false
	}

	if isProd {
		Endpoint = "https://creatornode2.audius.co"
		fmt.Println("running in production")
	} else {
		fmt.Println("running in staging")
		Endpoint = "https://creatornode11.staging.audius.co"
	}
}

func main() {
	setEndpoint()

	ctx, cancel := context.WithCancel(context.Background())
	var wg sync.WaitGroup

	wg.Add(3)

	go intakeUploadBatches(ctx, &wg)
	go consumeUploadBatches(ctx, &wg)
	go consumeAnalysisResults(ctx, &wg)

	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-signalChan
		cancel()
	}()

	wg.Wait()
}
