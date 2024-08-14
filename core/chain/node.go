package chain

import (
	"context"
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	cfg "github.com/cometbft/cometbft/config"
	nm "github.com/cometbft/cometbft/node"
	"github.com/cometbft/cometbft/p2p"
	"github.com/cometbft/cometbft/privval"
	"github.com/cometbft/cometbft/proxy"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewNode(logger *common.Logger, c *config.Config, pool *pgxpool.Pool) (*nm.Node, error) {
	rootDir := c.RootDir

	config := cfg.DefaultConfig()
	config.SetRoot(rootDir)

	// postgres indexer config
	config.TxIndex.Indexer = "psql"
	config.TxIndex.PsqlConn = c.PSQLConn
	config.TxIndex.TableBlocks = "core_blocks"
	config.TxIndex.TableTxResults = "core_tx_results"
	config.TxIndex.TableEvents = "core_events"
	config.TxIndex.TableAttributes = "core_attributes"

	config.P2P.PexReactor = true

	if c.PersistentPeers != "" {
		config.P2P.PersistentPeers = c.PersistentPeers
	}

	if c.RPCladdr != "" {
		config.RPC.ListenAddress = c.RPCladdr
	}
	if c.P2PLaddr != "" {
		config.P2P.ListenAddress = c.P2PLaddr
	}

	app := NewKVStoreApplication(logger, pool)

	pv := privval.LoadFilePV(
		config.PrivValidatorKeyFile(),
		config.PrivValidatorStateFile(),
	)

	nodeKey, err := p2p.LoadNodeKey(config.NodeKeyFile())
	if err != nil {
		return nil, fmt.Errorf("failed to load node's key: %v", err)
	}

	node, err := nm.NewNode(
		context.Background(),
		config,
		pv,
		nodeKey,
		proxy.NewLocalClientCreator(app),
		nm.DefaultGenesisDocProviderFunc(config),
		cfg.DefaultDBProvider,
		nm.DefaultMetricsProvider(config.Instrumentation),
		logger,
	)

	if err != nil {
		return nil, fmt.Errorf("creating node: %v", err)
	}

	return node, nil
}
