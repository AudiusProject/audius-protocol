package server

import (
	"context"
	"fmt"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/contracts"
)

func (s *Server) startEthNodeManager() error {
	// Initial query with retries
	maxRetries := 10
	retryDelay := 2 * time.Second

	for i := 0; i < maxRetries; i++ {
		if err := s.gatherEthNodes(); err != nil {
			s.logger.Errorf("error gathering registered eth nodes (attempt %d/%d): %v", i+1, maxRetries, err)
			time.Sleep(retryDelay)
			retryDelay *= 2
		} else {
			break
		}
		if i == maxRetries-1 {
			return fmt.Errorf("failed to gather registered eth nodes after %d retries", maxRetries)
		}
	}

	close(s.awaitEthNodesReady)

	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		if err := s.gatherEthNodes(); err != nil {
			s.logger.Errorf("error gathering eth nodes: %v", err)
		}
	}
	return nil
}

func (s *Server) gatherEthNodes() error {
	s.logger.Info("gathering ethereum nodes")

	nodes, err := s.contracts.GetAllRegisteredNodes(context.Background())
	if err != nil {
		return err
	}

	if len(nodes) == 0 {
		return fmt.Errorf("got 0 registered nodes: %v", nodes)
	}

	ethNodeMap := make(map[string]int)
	duplicateEthNodes := []*contracts.Node{}

	for _, node := range nodes {
		ethaddr := node.DelegateOwnerWallet.String()
		ethNodeMap[ethaddr]++
		if ethNodeMap[ethaddr] > 1 {
			duplicateEthNodes = append(duplicateEthNodes, node)
		}
	}

	s.ethNodeMU.Lock()
	defer s.ethNodeMU.Unlock()

	s.ethNodes = nodes
	s.duplicateEthNodes = duplicateEthNodes

	return nil
}

func (s *Server) blacklistDuplicateEthNodes() error {
	return nil
}
