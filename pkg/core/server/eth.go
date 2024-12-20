package server

import (
	"context"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/contracts"
)

func (s *Server) startEthNodeManager() error {
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

	ethNodeMap := make(map[string]int)
	duplicateEthNodes := []*contracts.Node{}

	for _, node := range nodes {
		ethaddr := node.DelegateOwnerWallet.String()
		ethNodeMap[ethaddr]++
		if ethNodeMap[ethaddr] > 1 {
			duplicateEthNodes = append(duplicateEthNodes, node)
		}
	}

	s.ethNodeMU.RLock()
	defer s.ethNodeMU.RUnlock()

	s.ethNodes = nodes
	s.duplicateEthNodes = duplicateEthNodes

	return nil
}

func (s *Server) blacklistDuplicateEthNodes() error {
	return nil
}
