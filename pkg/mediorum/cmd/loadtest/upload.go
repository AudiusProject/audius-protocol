package loadtest

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"math/rand"
	"mime/multipart"
	"net/http"
	"sync"
)

func (tc *TestClient) DoUpload(wg *sync.WaitGroup, i int) {
	defer wg.Done()

	filename := fmt.Sprintf("test-audio-%04x.mp3", rand.Intn(10000))
	audioData, err := GenerateWhiteNoise(filename)
	if err != nil {
		fmt.Printf("error generating audio %d - %+v\n", i, err)
		return
	}

	err = tc.upload(audioData, filename)
	if err != nil {
		fmt.Println(err)
		return
	}
}

func (tc *TestClient) upload(data []byte, filename string) error {

	r, w := io.Pipe()
	m := multipart.NewWriter(w)
	errChan := make(chan error)
	file := bytes.NewReader(data)

	go func() {
		defer w.Close()
		defer m.Close()
		part, err := m.CreateFormFile("files", filename)
		if err != nil {
			errChan <- err
			return
		}
		if _, err = io.Copy(part, file); err != nil {
			errChan <- err
			return
		}
		if err = m.WriteField("template", "audio"); err != nil {
			errChan <- err
			return
		}
		close(errChan)
	}()

	host := tc.UpPeers[rand.Intn(len(tc.UpPeers))].Host
	url := fmt.Sprintf("%s%s", host, "/uploads")

	req, err := http.NewRequest("POST", url, r)
	if err != nil {
		return err
	}

	req.Header.Add("Content-Type", m.FormDataContentType())
	req.Header.Set("User-Agent", "mediorum-load-test")

	resp, err := tc.HttpClient.Do(req)
	if err != nil {
		return err
	}

	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return errors.New(resp.Status)
	}

	fmt.Printf("[POST] %s -> %s\n", filename, host)

	return <-errChan
}
