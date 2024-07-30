package config

import (
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/accounts"
	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config/genesis"
	"github.com/cometbft/cometbft/config"
	"github.com/cometbft/cometbft/p2p"
	"github.com/cometbft/cometbft/privval"
)

// reads in or creates cometbft keys from the delegate private key
// also creates validator keys and genesis file
func InitComet(logger *common.Logger, environment, delegatePrivateKey, homeDir string) error {
	logger.Info("initializing comet config")

	key, err := accounts.EthToCometKey(delegatePrivateKey)
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
		logger.Info("Found private validator", "keyFile", privValKeyFile,
			"stateFile", privValStateFile)
	} else {
		pv = privval.NewFilePV(key, privValKeyFile, privValStateFile)
		pv.Save()
		logger.Info("Generated private validator", "keyFile", privValKeyFile,
			"stateFile", privValStateFile)
	}

	nodeKeyFile := config.NodeKeyFile()
	if common.FileExists(nodeKeyFile) {
		logger.Info("Found node key", "path", nodeKeyFile)
	} else {
		p2pKey := p2p.NodeKey{
			PrivKey: key,
		}
		if err := p2pKey.SaveAs(nodeKeyFile); err != nil {
			return fmt.Errorf("creating node key %v", err)
		}
		logger.Info("Generated node key", "path", nodeKeyFile)
	}

	genFile := config.GenesisFile()
	if common.FileExists(genFile) {
		logger.Info("Found genesis file", "path", genFile)
	} else {

		genDoc, err := genesis.Read(environment)
		if err != nil {
			return fmt.Errorf("error reading genesis: %v", err)
		}

		if err := genDoc.SaveAs(genFile); err != nil {
			return fmt.Errorf("saving gen file %v", err)
		}
		logger.Info("Generated genesis file", "path", genFile)
	}
	return nil
}
