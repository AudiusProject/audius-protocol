package contracts

import (
	"fmt"

	"github.com/AudiusProject/audius-protocol/pkg/core/config"
)

func ServiceType(nt config.NodeType) ([32]byte, error) {
	switch nt {
	case config.Discovery:
		return DiscoveryNode, nil
	case config.Content:
		return ContentNode, nil
	}
	return [32]byte{}, fmt.Errorf("node type provided not valid: %v", nt)
}
