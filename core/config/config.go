package config

import (
	"flag"
	"fmt"
	"os"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/davecgh/go-spew/spew"
	"github.com/joho/godotenv"
)

type NodeType = int

const (
	Discovery NodeType = iota
	Content
	Identity
)

type Config struct {
	/* Comet Config */
	HomeDir      string
	RPCladdr     string
	P2PLaddr     string
	PSQLConn     string
	RetainBlocks uint

	/* Audius Config */
	Environment        string
	DelegatePrivateKey string
}

func ReadConfig(logger *common.Logger) (*Config, error) {
	// read in dotenv if passed in via flag
	envFile := flag.String("env-file", "", ".env file to read for config")

	flag.Parse()

	// load dotenv file if passed in
	if *envFile != "" {
		logger.Infof("reading env from file %s", *envFile)
		if err := godotenv.Load(*envFile); err != nil {
			return nil, fmt.Errorf("dot env provided but couldn't load %v", err)
		}
	}

	var cfg Config
	// comet config
	cfg.HomeDir = os.Getenv("homeDir")

	// check if discovery specific key is set
	isDiscovery := os.Getenv("audius_delegate_private_key") != ""
	if isDiscovery {
		cfg.Environment = os.Getenv("audius_discprov_env")
		cfg.DelegatePrivateKey = os.Getenv("audius_delegate_private_key")
		cfg.PSQLConn = os.Getenv("audius_db_url")
	} else {
		// isContent
		cfg.Environment = os.Getenv("MEDIORUM_ENV")
		cfg.DelegatePrivateKey = os.Getenv("delegatePrivateKey")
		cfg.PSQLConn = os.Getenv("dbUrl")
	}

	fmt.Println(os.Getenv("audius_delegate_private_key"))

	spew.Dump(cfg)

	if err := InitComet(logger, cfg.Environment, cfg.DelegatePrivateKey, cfg.HomeDir); err != nil {
		return nil, fmt.Errorf("initializing comet %v", err)
	}

	return &cfg, nil
}
