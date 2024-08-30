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
	Seeds           string
	ExternalAddress string
	AddrBookStrict  bool

	/* Audius Config */
	Environment        string
	DelegatePrivateKey string
	WalletAddress      string
	ProposerAddress    string
	GRPCladdr          string
	CoreServerAddr     string

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
	cfg.RPCladdr = getEnvWithDefault("rpcLaddr", "tcp://0.0.0.0:26657")
	cfg.P2PLaddr = getEnvWithDefault("p2pLaddr", "tcp://0.0.0.0:26656")

	cfg.GRPCladdr = getEnvWithDefault("grpcLaddr", "0.0.0.0:50051")
	cfg.CoreServerAddr = getEnvWithDefault("coreServerAddr", "0.0.0.0:26659")

	// check if discovery specific key is set
	isDiscovery := os.Getenv("audius_delegate_private_key") != ""
	if isDiscovery {
		cfg.Environment = os.Getenv("audius_discprov_env")
		cfg.DelegatePrivateKey = os.Getenv("audius_delegate_private_key")
		cfg.PSQLConn = getEnvWithDefault("audius_db_url", "postgresql://postgres:postgres@db:5432/audius_discovery")
	} else {
		// isContent
		cfg.Environment = os.Getenv("MEDIORUM_ENV")
		cfg.DelegatePrivateKey = os.Getenv("delegatePrivateKey")
		cfg.PSQLConn = getEnvWithDefault("dbUrl", "postgresql://postgres:postgres@db:5432/audius_creator_node")
	}

	if cfg.Environment == "" {
		return nil, errors.New("no environment set")
	}

	ethAddress, err := common.PrivKeyHexToAddress(cfg.DelegatePrivateKey)
	if err != nil {
		return nil, fmt.Errorf("could not get address from priv key: %v", err)
	}
	cfg.WalletAddress = ethAddress

	cfg.AddrBookStrict = true
	switch cfg.Environment {
	case "prod", "production", "mainnet":
		cfg.PersistentPeers = os.Getenv("persistentPeers")
	case "stage", "staging", "testnet":
		cfg.PersistentPeers = getEnvWithDefault("persistentPeers", "0f4be2aaa70e9570eee3485d8fa54502cf1a9fc0@34.67.210.7:26656")
	case "dev", "development", "devnet", "local", "sandbox":
		cfg.PersistentPeers = os.Getenv("persistentPeers")
		cfg.ExternalAddress = os.Getenv("externalAddress")
		cfg.AddrBookStrict = false
	}

	// Disable ssl for local postgres db connection
	if !strings.HasSuffix(cfg.PSQLConn, "?sslmode=disable") && isLocalDbUrlRegex.MatchString(cfg.PSQLConn) {
		cfg.PSQLConn += "?sslmode=disable"
	}

	// only allow down migration in dev env
	cfg.RunDownMigration = os.Getenv("runDownMigration") == "true" && (cfg.Environment == "dev" || cfg.Environment == "sandbox")

	if err := InitComet(logger, &cfg); err != nil {
		return nil, fmt.Errorf("initializing comet %v", err)
	}

	return &cfg, nil
}

func getEnvWithDefault(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
