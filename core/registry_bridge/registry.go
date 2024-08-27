package registry_bridge

import (
	"context"
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/contracts"
	"github.com/cometbft/cometbft/rpc/client/local"
)

// registry oversees what this node believes to be validators
type Registry struct {
	logger    *common.Logger
	config    *config.Config
	rpc       *local.Local
	contracts *contracts.AudiusContracts
	state     *State
}

func NewRegistryBridge(logger *common.Logger, cfg *config.Config, rpc *local.Local, contracts *contracts.AudiusContracts) (*Registry, error) {
	ctx := context.Background()

	// check eth status
	_, err := contracts.Rpc.ChainID(ctx)
	if err != nil {
		return nil, fmt.Errorf("init registry bridge failed eth chain id: %v", err)
	}

	// check comet status
	_, err = rpc.Status(ctx)
	if err != nil {
		return nil, fmt.Errorf("init registry bridge failed comet rpc status: %v", err)
	}

	return &Registry{
		logger:    logger,
		config:    cfg,
		rpc:       rpc,
		contracts: contracts,
		state:     NewState(),
	}, nil
}
