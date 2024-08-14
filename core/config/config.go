package config

import (
	"errors"
	"flag"
	"fmt"
	"os"
	"regexp"
	"strings"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/joho/godotenv"
)

type NodeType = int

const (
	Discovery NodeType = iota
	Content
	Identity
)

const dbUrlLocalPattern string = `^postgresql:\/\/\w+:\w+@(db|localhost):.*`

var isLocalDbUrlRegex = regexp.MustCompile(dbUrlLocalPattern)

type Config struct {
	/* Comet Config */
	RootDir         string
	RPCladdr        string
	P2PLaddr        string
	PSQLConn        string
	RetainBlocks    uint
	PersistentPeers string

	/* Audius Config */
	Environment        string
	DelegatePrivateKey string

	/* System Config */
	RunDownMigration bool
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
	cfg.RootDir = os.Getenv("audius_core_root_dir")
	cfg.RPCladdr = getEnvString("rpcLaddr", DefaultRPCAddress)
	cfg.P2PLaddr = getEnvString("p2pLaddr", DefaultP2PAddress)

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

	if cfg.Environment == "" {
		return nil, errors.New("no environment set")
	}

	switch cfg.Environment {
	case "prod", "production", "mainnet":
		cfg.PersistentPeers = os.Getenv("persistentPeers")
	case "stage", "staging", "testnet":
		cfg.PersistentPeers = getEnvString("persistentPeers", DefaultTestnetPersistentPeers)
	case "dev", "development", "devnet", "local":
		cfg.PersistentPeers = os.Getenv("persistentPeers")
	}

	// Disable ssl for local postgres db connection
	if !strings.HasSuffix(cfg.PSQLConn, "?sslmode=disable") && isLocalDbUrlRegex.MatchString(cfg.PSQLConn) {
		cfg.PSQLConn += "?sslmode=disable"
	}

	// only allow down migration in dev env
	cfg.RunDownMigration = os.Getenv("runDownMigration") == "true" && cfg.Environment == "dev"

	if err := InitComet(logger, cfg.Environment, cfg.DelegatePrivateKey, cfg.RootDir); err != nil {
		return nil, fmt.Errorf("initializing comet %v", err)
	}

	return &cfg, nil
}
