package server

import (
	"context"
	"errors"
	"time"
)

var (
	ErrRpcStatusNotFound      = errors.New("local rpc status not returned")
	ErrRpcNotSynced           = errors.New("local rpc not synced")
	ErrCreateValidatorClients = errors.New("couldn't create validator clients")
)

// tasks that execute once the node is fully synced
func (s *Server) startSyncTasks() error {
	s.logger.Info("starting sync tasks")

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		if err := s.onSyncTick(); err != nil {
			s.logger.Debugf("still syncing: %v", err)
		} else {
			return nil
		}
	}
	return nil
}

func (s *Server) onSyncTick() error {
	<-s.awaitGrpcServerReady
	<-s.awaitRpcReady

	status, _ := s.rpc.Status(context.Background())
	if status == nil {
		return ErrRpcStatusNotFound
	}

	if status.SyncInfo.CatchingUp {
		return ErrRpcNotSynced
	}

	return nil
}
