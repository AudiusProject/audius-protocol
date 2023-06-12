package server

import (
	"context"
	"errors"
	"fmt"
	"io"
	"mediorum/server/signature"
	"mime/multipart"
	"net/http"
	"time"

	"golang.org/x/exp/slices"
	"gorm.io/gorm"
)

func (ss *MediorumServer) replicateFile(fileName string, file io.ReadSeeker) ([]string, error) {
	logger := ss.logger.With("task", "replicate", "cid", fileName)

	healthyHostNames := ss.findHealthyPeers(5 * time.Minute)
	success := []string{}
	for _, peer := range ss.placement.topAll(fileName) {
		logger := logger.With("to", peer.Host)

		if !slices.Contains(healthyHostNames, peer.Host) {
			logger.Info("skipping unhealthy host", "healthy", healthyHostNames)
			continue
		}

		logger.Info("replicating")

		file.Seek(0, 0)
		err := ss.replicateFileToHost(peer, fileName, file)
		if err != nil {
			logger.Error("replication failed", err)
		} else {
			logger.Info("replicated")
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
	logger := ss.logger.With("task", "replicateToMyBucket", "cid", fileName)
	logger.Info("replicateToMyBucket")

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
	var existingBlob *Blob
	found := ss.crud.DB.Where("host = ? AND key = ?", ss.Config.Self.Host, fileName).First(&existingBlob)
	if found.Error == gorm.ErrRecordNotFound {
		logger.Info("creating blob record")
		return ss.crud.Create(&Blob{
			Host:      ss.Config.Self.Host,
			Key:       fileName,
			CreatedAt: time.Now().UTC(),
		})
	}

	return nil
}

func (ss *MediorumServer) dropFromMyBucket(fileName string) error {
	logger := ss.logger.With("task", "dropFromMyBucket", "cid", fileName)

	logger.Info("deleting blob")
	ctx := context.Background()
	err := ss.bucket.Delete(ctx, fileName)
	if err != nil {
		logger.Error("failed to delete", err)
	}

	// if blob record exists... delete it
	var existingBlob *Blob
	found := ss.crud.DB.Where("host = ? AND key = ?", ss.Config.Self.Host, fileName).First(&existingBlob)
	if found.Error == nil {
		logger.Info("deleting blob record")
		return ss.crud.Delete(existingBlob)
	}

	return nil
}

func (ss *MediorumServer) replicateFileToHost(peer Peer, fileName string, file io.Reader) error {
	// logger := ss.logger.With()
	if peer.Host == ss.Config.Self.Host {
		return ss.replicateToMyBucket(fileName, file)
	}

	client := http.Client{
		Timeout: 30 * time.Second,
	}

	// first check if target already has it...
	// todo: this should be cheap check... host should be responsible for doing more expensive check
	if ss.hostHasBlob(peer.Host, fileName, true) {
		ss.logger.Info(peer.Host + " already has " + fileName)
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
		peer.ApiPath("internal/blobs")+"?cid="+fileName,
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

// this is a "quick check" that a host has a blob
// used for checking host has blob before redirecting to it
func (ss *MediorumServer) hostHasBlob(host, key string, doubleCheck bool) bool {
	client := http.Client{
		Timeout: 5 * time.Second,
	}
	checkMethod := "info"
	if doubleCheck {
		checkMethod = "double_check"
	}
	u := apiPath(host, "internal/blobs", checkMethod, key)
	has, err := client.Get(u)
	if err != nil {
		return false
	}
	defer has.Body.Close()
	return has.StatusCode == 200
}

func (ss *MediorumServer) pullFileFromHost(host, cid string) error {
	if host == ss.Config.Self.Host {
		return errors.New("should not pull blob from self")
	}
	client := http.Client{
		Timeout: 10 * time.Second,
	}
	u := apiPath(host, "internal/blobs", cid)

	req, err := signature.SignedGet(u, ss.Config.privateKey)
	if err != nil {
		return err
	}

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("pull blob: bad status: %d cid: %s host: %s", resp.StatusCode, cid, host)
	}

	return ss.replicateToMyBucket(cid, resp.Body)
}
