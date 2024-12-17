package config

import (
	"fmt"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config/genesis"
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
func SetupNode(logger *common.Logger) (*Config, *cconfig.Config, error) {
	// read in env / dotenv config
	envConfig, err := ReadConfig(logger)
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
		pv = privval.NewFilePV(envConfig.CometKey, privValKeyFile, privValStateFile)
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
			PrivKey: envConfig.CometKey,
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

	// dynamically voting in validators isn't implemented yet
	// use this to dynamically set connection values
	isInitialValidator := false
	validators := genDoc.Validators
	for _, validator := range validators {
		if validator.Address.String() == envConfig.CometKey.PubKey().Address().String() {
			isInitialValidator = true
			break
		}
	}

	// after succesful setup, setup comet config.toml

	// https://docs.cometbft.com/main/references/config/config.toml#log_level
	cometConfig.LogLevel = envConfig.LogLevel

	// postgres indexer config
	cometConfig.TxIndex.Indexer = "psql"
	cometConfig.TxIndex.PsqlConn = envConfig.PSQLConn
	cometConfig.TxIndex.TableBlocks = "core_blocks"
	cometConfig.TxIndex.TableTxResults = "core_tx_results"
	cometConfig.TxIndex.TableEvents = "core_events"
	cometConfig.TxIndex.TableAttributes = "core_attributes"

	// mempool
	// block size restricted to 10mb
	// individual tx size restricted to 300kb, this should be able to carry batches of 200-300 plays
	// 2k txs which is a little over 500mb restriction for the mempool size
	// this keeps the mempool from taking up too much memory
	cometConfig.Mempool.MaxTxsBytes = 10485760
	cometConfig.Mempool.MaxTxBytes = 307200
	cometConfig.Mempool.Size = 30000

	isDev := envConfig.Environment == "dev" || envConfig.Environment == "local"

	// consensus
	// don't recheck mempool transactions, rely on CheckTx and Propose step
	// set each phase to timeout at 100ms, this might be aggressive but simply put
	// for blocks to stay around 1s all these steps must add up to less than that
	// create empty blocks to continue heartbeat at the same interval
	// empty blocks wait one second to propose since plays should be a steady stream
	// of txs
	cometConfig.Mempool.Recheck = false
	cometConfig.Mempool.Broadcast = false
	cometConfig.Consensus.TimeoutCommit = 200 * time.Millisecond
	cometConfig.Consensus.TimeoutPropose = 200 * time.Millisecond
	cometConfig.Consensus.TimeoutProposeDelta = 75 * time.Millisecond
	cometConfig.Consensus.TimeoutPrevote = 150 * time.Millisecond
	cometConfig.Consensus.TimeoutPrevoteDelta = 75 * time.Millisecond
	cometConfig.Consensus.TimeoutPrecommit = 150 * time.Millisecond
	cometConfig.Consensus.TimeoutPrecommitDelta = 75 * time.Millisecond
	cometConfig.Consensus.CreateEmptyBlocks = true
	cometConfig.Consensus.CreateEmptyBlocksInterval = 1 * time.Second

	// peering
	// pex reactor is off since nodes use persistent peer list at the moment
	// turn back on for dynamic peer discovery if we don't implement it in
	// another ethereum based way
	cometConfig.P2P.PexReactor = isDev // turn off pex reactor in prod / stage
	cometConfig.P2P.AddrBookStrict = envConfig.AddrBookStrict
	if envConfig.PersistentPeers != "" {
		cometConfig.P2P.PersistentPeers = envConfig.PersistentPeers
	}
	if envConfig.ExternalAddress != "" {
		cometConfig.P2P.ExternalAddress = envConfig.ExternalAddress
	}

	// p2p
	// set validators to higher connection settings so they have tighter conns
	// with each other, this helps get to sub 1s block times
	cometConfig.P2P.MaxNumOutboundPeers = envConfig.MaxOutboundPeers
	cometConfig.P2P.MaxNumInboundPeers = envConfig.MaxInboundPeers
	cometConfig.P2P.AllowDuplicateIP = true
	if isInitialValidator {
		cometConfig.P2P.FlushThrottleTimeout = 10 * time.Millisecond
		cometConfig.P2P.SendRate = 5120000
		cometConfig.P2P.RecvRate = 5120000
		cometConfig.P2P.HandshakeTimeout = 3 * time.Second
		cometConfig.P2P.DialTimeout = 5 * time.Second
		cometConfig.P2P.PersistentPeersMaxDialPeriod = 15 * time.Second
	} else {
		cometConfig.P2P.FlushThrottleTimeout = 100 * time.Millisecond
		cometConfig.P2P.SendRate = 524288
		cometConfig.P2P.RecvRate = 524288
		cometConfig.P2P.HandshakeTimeout = 5 * time.Second
		cometConfig.P2P.DialTimeout = 10 * time.Second
		cometConfig.P2P.PersistentPeersMaxDialPeriod = 30 * time.Second
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
