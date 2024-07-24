package chain

import (
	"context"
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/config"
	cfg "github.com/cometbft/cometbft/config"
	"github.com/cometbft/cometbft/libs/log"
	nm "github.com/cometbft/cometbft/node"
	"github.com/cometbft/cometbft/p2p"
	"github.com/cometbft/cometbft/privval"
	"github.com/cometbft/cometbft/proxy"
	"github.com/dgraph-io/badger/v4"
)

func NewNode(logger log.Logger, c *config.Config, db *badger.DB) (*nm.Node, error) {
	homeDir := c.HomeDir

	config := cfg.DefaultConfig()
	config.SetRoot(homeDir)

	config.TxIndex.Indexer = "psql"
	config.TxIndex.PsqlConn = c.PSQLConn
	config.TxIndex.TableBlocks = "core_blocks"
	config.TxIndex.TableTxResults = "core_tx_results"
	config.TxIndex.TableEvents = "core_events"
	config.TxIndex.TableAttributes = "core_attributes"

	app := NewKVStoreApplication(db)

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
