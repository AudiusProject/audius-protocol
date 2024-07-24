package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/AudiusProject/audius-protocol/core/accounts"
	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/cometbft/cometbft/config"
	"github.com/cometbft/cometbft/privval"
	"github.com/cometbft/cometbft/types"
	cmttime "github.com/cometbft/cometbft/types/time"
)

func main() {
	logger := common.NewLogger(nil)

	logger.Info("initializing comet config")

	environment := flag.String("env", "", "environment that the genesis doc will belong to")
	delegatePrivateKey := flag.String("pkey", "", "private key of this node")
	homeDir := flag.String("homeDir", "", "directory where the comet config resides")

	flag.Parse()

	if *environment == "" {
		logger.Error("env is a required argument")
		return
	}

	if *delegatePrivateKey == "" {
		logger.Error("pkey is a required argument")
		return
	}

	if *homeDir == "" {
		logger.Error("homeDir is a required argument")
		return
	}

	chainId := ""
	switch *environment {
	case "prod", "production", "mainnet":
		chainId = "audius-mainnet-1"
	case "stage", "staging", "testnet":
		chainId = "audius-testnet-1"
	default:
		chainId = fmt.Sprintf("audius-devnet-%s", *environment)
	}

	logger.Infof("configuring node setup on env %s in %s", chainId, *homeDir)

	key, err := accounts.NewKey(*delegatePrivateKey)
	if err != nil {
		logger.Error("creating key", "error", err)
		return
	}

	if err := CreateDirIfNotExist(*homeDir); err != nil {
		logger.Error("error creating homeDir", "error", err)
	}

	if err := CreateDirIfNotExist(fmt.Sprintf("%s/config", *homeDir)); err != nil {
		logger.Error("error creating config dir", "error", err)
	}

	if err := CreateDirIfNotExist(fmt.Sprintf("%s/data", *homeDir)); err != nil {
		logger.Error("error creating data dir", "error", err)
	}

	config := config.DefaultConfig()
	config.SetRoot(*homeDir)

	privValKeyFile := config.PrivValidatorKeyFile()
	privValStateFile := config.PrivValidatorStateFile()

	var pv *privval.FilePV
	if FileExists(privValKeyFile) {
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
	if FileExists(nodeKeyFile) {
		logger.Info("Found node key", "path", nodeKeyFile)
	} else {
		if err := key.SaveAs(nodeKeyFile); err != nil {
			logger.Error("creating node key", "error", err)
			return
		}
		logger.Info("Generated node key", "path", nodeKeyFile)
	}

	genFile := config.GenesisFile()
	if FileExists(genFile) {
		logger.Info("Found genesis file", "path", genFile)
	} else {
		genDoc := types.GenesisDoc{
			ChainID:         chainId,
			GenesisTime:     cmttime.Now(),
			ConsensusParams: types.DefaultConsensusParams(),
		}
		pubKey, err := pv.GetPubKey()
		if err != nil {
			logger.Error("can't get pubkey", "error", err)
			return
		}
		genDoc.Validators = []types.GenesisValidator{{
			Address: pubKey.Address(),
			PubKey:  pubKey,
			Power:   10,
		}}

		if err := genDoc.SaveAs(genFile); err != nil {
			logger.Error("saving gen file", "error", err)
			return
		}
		logger.Info("Generated genesis file", "path", genFile)
	}

}

func FileExists(filePath string) bool {
	_, err := os.Stat(filePath)
	return !os.IsNotExist(err)
}

func CreateDirIfNotExist(dir string) error {
	err := os.MkdirAll(dir, os.ModePerm)
	if err != nil {
		return fmt.Errorf("failed to create directory %s: %w", dir, err)
	}
	return nil
}
