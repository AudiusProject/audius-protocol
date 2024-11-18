package chain

import (
	"context"
	"fmt"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/contracts"
	"github.com/AudiusProject/audius-protocol/pkg/core/mempool"
	"github.com/AudiusProject/audius-protocol/pkg/core/pubsub"
	cfg "github.com/cometbft/cometbft/config"
	nm "github.com/cometbft/cometbft/node"
	"github.com/cometbft/cometbft/p2p"
	"github.com/cometbft/cometbft/privval"
	"github.com/cometbft/cometbft/proxy"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewNode(logger *common.Logger, envConfig *config.Config, cometConfig *cfg.Config, pool *pgxpool.Pool, contracts *contracts.AudiusContracts, mempl *mempool.Mempool, txPubsub *pubsub.TransactionHashPubsub) (*nm.Node, error) {
	app := NewCoreApplication(logger, pool, contracts, envConfig, mempl, txPubsub)

	pv := privval.LoadFilePV(
		cometConfig.PrivValidatorKeyFile(),
		cometConfig.PrivValidatorStateFile(),
	)

	nodeKey, err := p2p.LoadNodeKey(cometConfig.NodeKeyFile())
	if err != nil {
		return nil, fmt.Errorf("failed to load node's key: %v", err)
	}

	node, err := nm.NewNode(
		context.Background(),
		cometConfig,
		pv,
		nodeKey,
		proxy.NewLocalClientCreator(app),
		nm.DefaultGenesisDocProviderFunc(cometConfig),
		cfg.DefaultDBProvider,
		nm.DefaultMetricsProvider(cometConfig.Instrumentation),
		logger.Child("chain"),
	)

	if err != nil {
		return nil, fmt.Errorf("creating node: %v", err)
	}

	return node, nil
}
