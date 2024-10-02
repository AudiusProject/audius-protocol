package registry_bridge

import (
	"context"
	"fmt"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/contracts"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/cometbft/cometbft/rpc/client/local"
	"github.com/jackc/pgx/v5/pgxpool"
)

// registry oversees what this node believes to be validators
type Registry struct {
	logger    *common.Logger
	config    *config.Config
	rpc       *local.Local
	contracts *contracts.AudiusContracts
	queries   *db.Queries
}

func NewRegistryBridge(logger *common.Logger, cfg *config.Config, rpc *local.Local, contracts *contracts.AudiusContracts, pool *pgxpool.Pool) (*Registry, error) {
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
		logger:    logger.Child("registry_bridge"),
		config:    cfg,
		rpc:       rpc,
		contracts: contracts,
		queries:   db.New(pool),
	}, nil
}
