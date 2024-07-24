package config

import (
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/accounts"
	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/cometbft/cometbft/config"
	"github.com/cometbft/cometbft/privval"
	"github.com/cometbft/cometbft/types"
	cmttime "github.com/cometbft/cometbft/types/time"
)

// reads in or creates cometbft keys from the delegate private key
// also creates validator keys and genesis file
func InitComet(logger *common.Logger, environment, delegatePrivateKey, homeDir string) error {
	logger.Info("initializing comet config")

	chainId := ""
	switch environment {
	case "prod", "production", "mainnet":
		chainId = "audius-mainnet-1"
	case "stage", "staging", "testnet":
		chainId = "audius-testnet-1"
	default:
		chainId = fmt.Sprintf("audius-devnet-%s", environment)
	}

	logger.Infof("configuring node setup on env %s in %s", chainId, homeDir)

	key, err := accounts.NewKey(delegatePrivateKey)
	if err != nil {
		return fmt.Errorf("creating key %v", err)
	}

	if err := common.CreateDirIfNotExist(homeDir); err != nil {
		logger.Error("error creating homeDir", "error", err)
	}

	if err := common.CreateDirIfNotExist(fmt.Sprintf("%s/config", homeDir)); err != nil {
		logger.Error("error creating config dir", "error", err)
	}

	if err := common.CreateDirIfNotExist(fmt.Sprintf("%s/data", homeDir)); err != nil {
		logger.Error("error creating data dir", "error", err)
	}

	config := config.DefaultConfig()
	config.SetRoot(homeDir)

	privValKeyFile := config.PrivValidatorKeyFile()
	privValStateFile := config.PrivValidatorStateFile()

	var pv *privval.FilePV
	if common.FileExists(privValKeyFile) {
		pv = privval.LoadFilePV(privValKeyFile, privValStateFile)
		logger.Info("Found private validator", "keyFile", privValKeyFile,
			"stateFile", privValStateFile)
	} else {
		pv = privval.NewFilePV(key.PrivKey, privValKeyFile, privValStateFile)
		pv.Save()
		logger.Info("Generated private validator", "keyFile", privValKeyFile,
			"stateFile", privValStateFile)
	}

	nodeKeyFile := config.NodeKeyFile()
	if common.FileExists(nodeKeyFile) {
		logger.Info("Found node key", "path", nodeKeyFile)
	} else {
		if err := key.SaveAs(nodeKeyFile); err != nil {
			return fmt.Errorf("creating node key %v", err)
		}
		logger.Info("Generated node key", "path", nodeKeyFile)
	}

	genFile := config.GenesisFile()
	if common.FileExists(genFile) {
		logger.Info("Found genesis file", "path", genFile)
	} else {
		genDoc := types.GenesisDoc{
			ChainID:         chainId,
			GenesisTime:     cmttime.Now(),
			ConsensusParams: types.DefaultConsensusParams(),
		}
		pubKey, err := pv.GetPubKey()
		if err != nil {
			return fmt.Errorf("can't get pubkey %v", err)
		}
		genDoc.Validators = []types.GenesisValidator{{
			Address: pubKey.Address(),
			PubKey:  pubKey,
			Power:   10,
		}}

		if err := genDoc.SaveAs(genFile); err != nil {
			return fmt.Errorf("saving gen file %v", err)
		}
		logger.Info("Generated genesis file", "path", genFile)
	}
	return nil
}
