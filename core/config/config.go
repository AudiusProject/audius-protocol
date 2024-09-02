package config

import (
	"errors"
	"flag"
	"fmt"
	"os"
	"regexp"
	"strings"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/cometbft/cometbft/types"
	"github.com/joho/godotenv"
)

type NodeType = int

const (
	Discovery NodeType = iota
	Content
	Identity
)

const (
	ProdRegistryAddress  = "0xd976d3b4f4e22a238c1A736b6612D22f17b6f64C"
	StageRegistryAddress = "0xF27A9c44d7d5DDdA29bC1eeaD94718EeAC1775e3"
	DevRegistryAddress   = "0xABbfF712977dB51f9f212B85e8A4904c818C2b63"

	ProdAcdcAddress  = "0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64"
	StageAcdcAddress = "0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64"
	DevAcdcAddress   = "0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B"

	ProdEthRpc  = "https://eth.audius.co"
	StageEthRpc = "https://eth.staging.audius.co"
	DevEthRpc   = "http://eth-ganache:8545"
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

	EthRPCUrl          string
	EthRegistryAddress string

	/* System Config */
	RunDownMigration bool

	GenesisFile *types.GenesisDoc
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
		cfg.EthRPCUrl = os.Getenv("audius_web3_eth_provider_url")
		cfg.EthRegistryAddress = os.Getenv("audius_contracts_registry")
	} else {
		// isContent
		cfg.Environment = os.Getenv("MEDIORUM_ENV")
		cfg.DelegatePrivateKey = os.Getenv("delegatePrivateKey")
		cfg.PSQLConn = getEnvWithDefault("dbUrl", "postgresql://postgres:postgres@db:5432/audius_creator_node")
		cfg.EthRPCUrl = os.Getenv("ethProviderUrl")
		cfg.EthRegistryAddress = os.Getenv("ethRegistryAddress")
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
		if cfg.EthRPCUrl == "" {
			cfg.EthRPCUrl = ProdEthRpc
		}
		if cfg.EthRegistryAddress == "" {
			cfg.EthRegistryAddress = ProdRegistryAddress
		}

	case "stage", "staging", "testnet":
		cfg.PersistentPeers = getEnvWithDefault("persistentPeers", "0f4be2aaa70e9570eee3485d8fa54502cf1a9fc0@34.67.210.7:26656")
		if cfg.EthRPCUrl == "" {
			cfg.EthRPCUrl = StageEthRpc
		}
		if cfg.EthRegistryAddress == "" {
			cfg.EthRegistryAddress = StageRegistryAddress
		}
	case "dev", "development", "devnet", "local", "sandbox":
		cfg.PersistentPeers = os.Getenv("persistentPeers")
		cfg.ExternalAddress = os.Getenv("externalAddress")
		cfg.AddrBookStrict = false
		if cfg.EthRPCUrl == "" {
			cfg.EthRPCUrl = DevEthRpc
		}
		if cfg.EthRegistryAddress == "" {
			cfg.EthRegistryAddress = DevRegistryAddress
		}
	}

	// Disable ssl for local postgres db connection
	if !strings.HasSuffix(cfg.PSQLConn, "?sslmode=disable") && isLocalDbUrlRegex.MatchString(cfg.PSQLConn) {
		cfg.PSQLConn += "?sslmode=disable"
	}

	return &cfg, nil
}

func getEnvWithDefault(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
