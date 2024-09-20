package main

import (
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/accounts"
	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/config/genesis"
	cconfig "github.com/cometbft/cometbft/config"
	"github.com/cometbft/cometbft/p2p"
	"github.com/cometbft/cometbft/privval"
)

/*
Reads in config, sets up comet files, and cleans up state
based on setup configuration.

- reads in env config
- determines env
- gathers chain id
*/
func setupNode(logger *common.Logger, version string) (*config.Config, *cconfig.Config, error) {
	// read in env / dotenv config
	envConfig, err := config.ReadConfig(logger, version)
	if err != nil {
		return nil, nil, fmt.Errorf("reading env config: %v", err)
	}

	// gather genesis doc based on environment
	genDoc, err := genesis.Read(envConfig.Environment)
	if err != nil {
		return nil, nil, fmt.Errorf("reading genesis: %v", err)
	}
	envConfig.GenesisFile = genDoc

	// gather chain id
	chainID := genDoc.ChainID

	// assemble comet paths
	cometRootDir := fmt.Sprintf("%s/%s", envConfig.RootDir, chainID)
	cometConfigDir := fmt.Sprintf("%s/config", cometRootDir)
	cometDataDir := fmt.Sprintf("%s/data", cometRootDir)

	// create dirs if they don't exist
	if err := common.CreateDirIfNotExist(cometRootDir); err != nil {
		return nil, nil, fmt.Errorf("created comet root dir: %v", err)
	}

	if err := common.CreateDirIfNotExist(cometConfigDir); err != nil {
		return nil, nil, fmt.Errorf("created comet config dir: %v", err)
	}

	if err := common.CreateDirIfNotExist(cometDataDir); err != nil {
		return nil, nil, fmt.Errorf("created comet data dir: %v", err)
	}

	// create default comet config
	cometConfig := cconfig.DefaultConfig()
	cometConfig.SetRoot(cometRootDir)

	// get derived comet key
	delegatePrivateKey := envConfig.DelegatePrivateKey
	key, err := accounts.EthToCometKey(delegatePrivateKey)
	if err != nil {
		return nil, nil, fmt.Errorf("creating key %v", err)
	}
	envConfig.CometKey = key

	ethKey, err := accounts.EthToEthKey(delegatePrivateKey)
	if err != nil {
		return nil, nil, fmt.Errorf("creating eth key %v", err)
	}
	envConfig.EthereumKey = ethKey

	// get paths to priv validator and state file
	privValKeyFile := cometConfig.PrivValidatorKeyFile()
	privValStateFile := cometConfig.PrivValidatorStateFile()

	// set validator and state file for derived comet key
	var pv *privval.FilePV
	if common.FileExists(privValKeyFile) {
		logger.Info("Found private validator", "keyFile", privValKeyFile,
			"stateFile", privValStateFile)
		pv = privval.LoadFilePV(privValKeyFile, privValStateFile)
	} else {
		pv = privval.NewFilePV(key, privValKeyFile, privValStateFile)
		pv.Save()
		logger.Info("Generated private validator", "keyFile", privValKeyFile,
			"stateFile", privValStateFile)
	}

	// now that we know proposer addr, set in config
	envConfig.ProposerAddress = pv.GetAddress().String()

	// setup p2p key from derived key
	nodeKeyFile := cometConfig.NodeKeyFile()
	if common.FileExists(nodeKeyFile) {
		logger.Info("Found node key", "path", nodeKeyFile)
	} else {
		p2pKey := p2p.NodeKey{
			PrivKey: key,
		}
		if err := p2pKey.SaveAs(nodeKeyFile); err != nil {
			return nil, nil, fmt.Errorf("creating node key %v", err)
		}
		logger.Info("Generated node key", "path", nodeKeyFile)
	}

	// save gen file if it doesn't exist
	genFile := cometConfig.GenesisFile()
	if common.FileExists(genFile) {
		logger.Info("Found genesis file", "path", genFile)
	} else {
		if err := genDoc.SaveAs(genFile); err != nil {
			return nil, nil, fmt.Errorf("saving gen file %v", err)
		}
		logger.Info("generated new genesis, running down migrations to start new")
		envConfig.RunDownMigration = true
		logger.Info("Generated genesis file", "path", genFile)
	}

	// after succesful setup, setup comet config.toml
	// postgres indexer config
	cometConfig.TxIndex.Indexer = "psql"
	cometConfig.TxIndex.PsqlConn = envConfig.PSQLConn
	cometConfig.TxIndex.TableBlocks = "core_blocks"
	cometConfig.TxIndex.TableTxResults = "core_tx_results"
	cometConfig.TxIndex.TableEvents = "core_events"
	cometConfig.TxIndex.TableAttributes = "core_attributes"

	// db and state config
	cometConfig.Consensus.CreateEmptyBlocks = false

	// mempool
	cometConfig.Mempool.Recheck = true
	cometConfig.Mempool.Size = 100000

	// peering
	cometConfig.P2P.PexReactor = true
	cometConfig.P2P.AddrBookStrict = envConfig.AddrBookStrict
	if envConfig.PersistentPeers != "" {
		cometConfig.P2P.PersistentPeers = envConfig.PersistentPeers
	}
	if envConfig.Seeds != "" {
		cometConfig.P2P.Seeds = envConfig.Seeds
	}
	if envConfig.ExternalAddress != "" {
		cometConfig.P2P.ExternalAddress = envConfig.ExternalAddress
	}

	// connection settings
	if envConfig.RPCladdr != "" {
		cometConfig.RPC.ListenAddress = envConfig.RPCladdr
	}
	if envConfig.P2PLaddr != "" {
		cometConfig.P2P.ListenAddress = envConfig.P2PLaddr
	}

	return envConfig, cometConfig, nil
}
