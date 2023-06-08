package server

import (
	"context"
	"errors"
	"io"
	"mediorum/server/signature"
	"mime/multipart"
	"net/http"
	"time"

	"golang.org/x/exp/slices"
)

func (ss *MediorumServer) replicateFile(fileName string, file io.ReadSeeker) ([]string, error) {
	logger := ss.logger.With("key", fileName)

	healthyHostNames := ss.findHealthyHostNames("5 minutes")
	success := []string{}
	for _, peer := range ss.placement.topAll(fileName) {
		logger := logger.With("to", peer.Host)

		if !slices.Contains(healthyHostNames, peer.Host) {
			logger.Debug("skipping unhealthy host", "healthy", healthyHostNames)
			continue
		}

		file.Seek(0, 0)
		err := ss.replicateFileToHost(peer, fileName, file)
		if err != nil {
			logger.Warn("replication failed", "err", err)
		} else {
			logger.Debug("replicated")
			success = append(success, peer.Host)
			if len(success) == ss.Config.ReplicationFactor {
				break
			}
		}
	}

	return success, nil
}

func (ss *MediorumServer) replicateToMyBucket(fileName string, file io.Reader) error {
	ctx := context.Background()

	// already have?
	alreadyHave, _ := ss.bucket.Exists(ctx, fileName)
	if !alreadyHave {
		w, err := ss.bucket.NewWriter(ctx, fileName, nil)
		if err != nil {
			return err
		}

		_, err = io.Copy(w, file)
		if err != nil {
			return err
		}

		w.Close()
	}

	// record that we "have" this key
	return ss.crud.Create(&Blob{
		Host:      ss.Config.Self.Host,
		Key:       fileName,
		CreatedAt: time.Now().UTC(),
	})
}

func (ss *MediorumServer) dropFromMyBucket(fileName string) error {
	ctx := context.Background()
	err := ss.bucket.Delete(ctx, fileName)
	if err != nil {
		return err
	}

	// record that we deleted this key
	return ss.crud.Delete(&Blob{
		Host: ss.Config.Self.Host,
		Key:  fileName,
	})
}

func (ss *MediorumServer) replicateFileToHost(peer Peer, fileName string, file io.Reader) error {
	if peer.Host == ss.Config.Self.Host {
		return ss.replicateToMyBucket(fileName, file)
	}

	client := http.Client{
		Timeout: 30 * time.Second,
	}

	// first check if target already has it...
	if ss.hostHasBlob(peer.Host, fileName) {
		ss.logger.Debug(peer.Host + " already has " + fileName)
		return nil
	}

	r, w := io.Pipe()
	m := multipart.NewWriter(w)
	errChan := make(chan error)

	go func() {
		defer w.Close()
		defer m.Close()
		part, err := m.CreateFormFile(filesFormFieldName, fileName)
		if err != nil {
			errChan <- err
			return
		}
		if _, err = io.Copy(part, file); err != nil {
			errChan <- err
			return
		}
		close(errChan)
	}()

	req := signature.SignedPost(
		peer.ApiPath("internal/blobs"),
		m.FormDataContentType(),
		r,
		ss.Config.privateKey)

	// send it
	resp, err := client.Do(req)
	if err != nil {
		return err
	}

	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return errors.New(resp.Status)
	}

	return <-errChan
}

func (ss *MediorumServer) hostHasBlob(host, key string) bool {
	client := http.Client{
		Timeout: 5 * time.Second,
	}
	u := apiPath(host, "internal/blobs/info", key)
	has, err := client.Get(u)
	if err != nil {
		return false
	}
	defer has.Body.Close()
	return has.StatusCode == 200
}
