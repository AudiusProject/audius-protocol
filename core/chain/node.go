package chain

import (
	"context"
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/common"
	cfg "github.com/cometbft/cometbft/config"
	"github.com/cometbft/cometbft/libs/log"
	nm "github.com/cometbft/cometbft/node"
	"github.com/cometbft/cometbft/p2p"
	"github.com/cometbft/cometbft/privval"
	"github.com/cometbft/cometbft/proxy"
	"github.com/dgraph-io/badger/v4"
	"github.com/spf13/viper"
)

func NewNode(logger log.Logger, c *common.Config, db *badger.DB) (*nm.Node, error) {
	homeDir := c.HomeDir

	config := cfg.DefaultConfig()
	config.SetRoot(homeDir)
	viper.SetConfigFile(fmt.Sprintf("%s/%s", homeDir, "config/config.toml"))

	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("reading config: %v", err)
	}
	if err := viper.Unmarshal(config); err != nil {
		return nil, fmt.Errorf("decoding config: %v", err)
	}
	if err := config.ValidateBasic(); err != nil {
		return nil, fmt.Errorf("invalid configuration data: %v", err)
	}

	app := NewKVStoreApplication(db)

	pv := privval.LoadFilePV(
		config.PrivValidatorKeyFile(),
		config.PrivValidatorStateFile(),
	)

	nodeKey, err := p2p.LoadNodeKey(config.NodeKeyFile())
	if err != nil {
		return nil, fmt.Errorf("failed to load node's key: %v", err)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to parse log level: %v", err)
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
