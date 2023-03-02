package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"os"
	"os/signal"
	"strings"
	"sync"
	"time"

	"comms.audius.co/shared/utils"
	"comms.audius.co/storage/client/load"
	"comms.audius.co/storage/monitor"
	"comms.audius.co/storage/persistence"
	"comms.audius.co/storage/transcode"
	"github.com/nats-io/nats.go"
	"golang.org/x/exp/slices"
)

const (
	UserAgent = "storageclient/0.0.1"
)

type StorageClient struct {
	Endpoint string
	Client   *http.Client
}

func NewStorageClient(endpoint string) StorageClient {
	return StorageClient{
		Endpoint: endpoint,
		Client:   &http.Client{},
	}
}

func (sc *StorageClient) Upload(data []byte, jobType transcode.JobTemplate, contentType string, filename string) error {
	route := "/storage/api/v1/file"

	values := map[string]io.Reader{
		"files":    bytes.NewReader(data),
		"template": strings.NewReader(string(jobType)),
	}

	var b bytes.Buffer
	w := multipart.NewWriter(&b)
	for key, r := range values {
		var fw io.Writer
		var err error

		if x, ok := r.(io.Closer); ok {
			defer x.Close()
		}
		// Add an image file
		if _, ok := r.(*bytes.Reader); ok {
			h := make(textproto.MIMEHeader)
			h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="%s"; filename="%s"`, key, filename))
			h.Set("Content-Type", contentType)
			if fw, err = w.CreatePart(h); err != nil {
				fmt.Printf("Error creating file form field %+v\n", err)
				return err
			}
		} else {
			// Add other fields
			if fw, err = w.CreateFormField(key); err != nil {
				fmt.Printf("Error creating form field %+v\n", err)
				return err
			}
		}
		if _, err = io.Copy(fw, r); err != nil {
			fmt.Printf("Error doing io.Copy %+v\n", err)
			return err
		}

	}
	// Don't forget to close the multipart writer.
	// If you don't close it, your request will be missing the terminating boundary.
	w.Close()

	// Submit the request
	url := fmt.Sprintf("%s%s", sc.Endpoint, route)
	res, err := sc.Client.Post(url, w.FormDataContentType(), &b)
	if err != nil {
		fmt.Printf("Error doing Post %+v\n", err)
		return err
	}

	// Check the response
	if res.StatusCode != http.StatusOK {
		err = fmt.Errorf("bad status: %s", res.Status)
		fmt.Printf("Bad status code %+v\n", err)

		return err
	}

	return nil
}

func (sc *StorageClient) UploadAudio(audioData []byte, filename string) error {
	return sc.Upload(audioData, transcode.JobTemplateAudio, "audio/mpeg", filename)
}

func (sc *StorageClient) UploadPng(imageData []byte, filename string) error {
	rand.Seed(time.Now().UnixNano())

	var imageType transcode.JobTemplate
	if rand.Float32() < 0.5 {
		imageType = transcode.JobTemplateImgBackdrop
	} else {
		imageType = transcode.JobTemplateImgSquare
	}

	return sc.Upload(imageData, imageType, "image/png", filename)
}

func (sc *StorageClient) SeedAudio(audioCount int) {
	wg := sync.WaitGroup{}
	for i := 0; i < int(audioCount); i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			audioData, err := utils.GenerateWhiteNoise(60)
			if err != nil {
				return
			}

			filename := fmt.Sprintf("audio-seed-%d.mp3", id)
			err = sc.UploadAudio(audioData, filename)
			if err != nil {
				return
			}
		}(i)
	}

	wg.Wait()
}

func (sc *StorageClient) GetJobs() ([]*transcode.Job, error) {
	route := "/storage/api/v1/jobs"

	resp, err := sc.Client.Get(fmt.Sprintf("%s%s", sc.Endpoint, route))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var jobs []*transcode.Job
	err = json.Unmarshal(body, &jobs)
	if err != nil {
		return nil, err
	}

	return jobs, nil
}

func (sc *StorageClient) GetJob(jobId string) (*transcode.Job, error) {
	route := "/storage/api/v1/jobs"

	resp, err := sc.Client.Get(fmt.Sprintf("%s%s/%s", sc.Endpoint, route, jobId))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var job transcode.Job
	err = json.Unmarshal(body, &job)
	if err != nil {
		return nil, err
	}

	return &job, nil
}

func (sc *StorageClient) GetNodeStatuses() (*map[string]monitor.NodeStatus, error) {
	route := "/storage/api/v1/node-statuses"

	resp, err := sc.Client.Get(fmt.Sprintf("%s%s", sc.Endpoint, route))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var nodeStatuses map[string]monitor.NodeStatus
	err = json.Unmarshal(body, &nodeStatuses)
	if err != nil {
		return nil, err
	}

	return &nodeStatuses, nil
}

func (sc *StorageClient) GetStorageNodesFor(jobId string) ([]string, error) {
	nodeStatuses, err := sc.GetNodeStatuses()
	if err != nil {
		return nil, err
	}

	shard := jobId[len(jobId)-2:]

	nodes := []string{}
	for _, nodeStatus := range *nodeStatuses {
		if slices.Contains(nodeStatus.Shards, shard) {
			nodes = append(nodes, nodeStatus.Host)
		}
	}

	return nodes, nil
}

func (sc *StorageClient) GetKeysByShard(shard string) (*[]string, error) {
	route := "/storage/api/v1/persistence/shard"

	resp, err := sc.Client.Get(fmt.Sprintf("%s%s/%s", sc.Endpoint, route, shard))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var keys []string
	err = json.Unmarshal(body, &keys)
	if err != nil {
		return nil, err
	}

	return &keys, nil
}

func (sc *StorageClient) GetObjFromTmpStore(bucket string, key string) (*nats.ObjectResult, error) {
	route := "/storage/api/v1/tmp-obj"

	resp, err := sc.Client.Get(fmt.Sprintf("%s%s/%s/%s", sc.Endpoint, route, bucket, key))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var obj nats.ObjectResult
	err = json.Unmarshal(body, &obj)
	if err != nil {
		return nil, err
	}

	return &obj, nil
}

func (sc *StorageClient) GetFile(filename string) ([]byte, error) {
	route := "/storage/api/v1/persistent/file"

	resp, err := sc.Client.Get(fmt.Sprintf("%s%s/%s", sc.Endpoint, route, filename))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return body, nil
}

func (sc *StorageClient) GetJobResultsFor(jobId string) ([]*persistence.ShardAndFile, error) {
	route := "/storage/api/v1/job-results"

	resp, err := sc.Client.Get(fmt.Sprintf("%s%s/%s", sc.Endpoint, route, jobId))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var shardAndFile []*persistence.ShardAndFile
	err = json.Unmarshal(body, &shardAndFile)
	if err != nil {
		return nil, err
	}

	return shardAndFile, nil
}

func (sc *StorageClient) AudioUploadLoadTest(numRequest int, concurrency int, queriesPerSecond float64, timeout int) (*loadtest.Report, error) {

	numRequests := numRequest
	conc := concurrency
	q := queriesPerSecond
	t := timeout
	output := ""
	dur := time.Duration(10) * time.Minute
	route := "/storage/api/v1/file"

	audioData, err := utils.GenerateWhiteNoise(300)
	if err != nil {
		return nil, err
	}

	values := map[string]io.Reader{
		"files":    bytes.NewReader(audioData),
		"template": strings.NewReader("audio"),
	}

	var b bytes.Buffer
	w := multipart.NewWriter(&b)
	for key, r := range values {
		var fw io.Writer
		var err error

		if x, ok := r.(io.Closer); ok {
			defer x.Close()
		}
		// Add an image file
		if _, ok := r.(*bytes.Reader); ok {
			h := make(textproto.MIMEHeader)
			h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="%s"; filename="%s"`, key, "load-test.mp3"))
			h.Set("Content-Type", "audio/mpeg")
			if fw, err = w.CreatePart(h); err != nil {
				fmt.Printf("Error creating file form field %+v\n", err)
				return nil, err
			}
		} else {
			// Add other fields
			if fw, err = w.CreateFormField(key); err != nil {
				fmt.Printf("Error creating form field %+v\n", err)
				return nil, err
			}
		}
		if _, err = io.Copy(fw, r); err != nil {
			fmt.Printf("Error doing io.Copy %+v\n", err)
			return nil, err
		}

	}
	// Don't forget to close the multipart writer.
	// If you don't close it, your request will be missing the terminating boundary.
	w.Close()

	header := make(http.Header)
	header.Set("Content-Type", w.FormDataContentType())

	url := fmt.Sprintf("%s%s", sc.Endpoint, route)
	req, err := http.NewRequest("POST", url, nil)
	if err != nil {
		return nil, err
	}

	req.ContentLength = int64(len(b.Bytes()))

	header.Set("User-Agent", UserAgent)

	req.Header = header

	work := &loadtest.Work{
		Request:            req,
		RequestBody:        b.Bytes(),
		N:                  numRequests,
		C:                  conc,
		QPS:                q,
		Timeout:            t,
		Output:             output,
	}
	work.Init()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	go func() {
		<-c
		work.Stop()
	}()
	if dur > 0 {
		go func() {
			time.Sleep(dur)
			work.Stop()
		}()
	}
	work.Run()

	return nil, nil
}
