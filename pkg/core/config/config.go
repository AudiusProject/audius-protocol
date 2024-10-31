package config

import (
	"crypto/ecdsa"
	"flag"
	"fmt"
	"log"
	"os"
	"regexp"
	"strconv"
	"strings"

	"github.com/AudiusProject/audius-protocol/pkg/core/accounts"
	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/cometbft/cometbft/crypto/ed25519"
	"github.com/cometbft/cometbft/types"
	"github.com/joho/godotenv"
)

type NodeType = int

const (
	Discovery NodeType = iota
	Content
	Identity
)

type RollupInterval struct {
	BlockInterval int
}

const (
	ProdRegistryAddress  = "0xd976d3b4f4e22a238c1A736b6612D22f17b6f64C"
	StageRegistryAddress = "0xc682C2166E11690B64338e11633Cb8Bb60B0D9c0"
	DevRegistryAddress   = "0xABbfF712977dB51f9f212B85e8A4904c818C2b63"

	ProdAcdcAddress  = "0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64"
	StageAcdcAddress = "0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64"
	DevAcdcAddress   = "0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B"

	ProdEthRpc  = "https://eth.audius.co"
	StageEthRpc = "https://eth.staging.audius.co"
	DevEthRpc   = "http://eth-ganache:8545"
)

const (
	ProdPersistentPeers  = "53a2506dcf34b267c3e04bb63e0ee4f563c7850d@34.67.133.214:26656,f0d79ce5eb91847db0a1b9ad4c8a15824710f9c3@34.121.217.14:26656,edf0b62f900c6319fdb482b0379b91b8a3c0d773@35.223.56.100:26656,35207ecb279b19ab53e0172f0e3ae47ac930d147@35.193.73.250:26656,bc6662eb1cff8c214fdd2147cef52ce6abc0b441@35.162.219.88:26656,2c47b1aba8e89caee91ac00c856b551a3035acad@34.208.174.151:26656,3afb27bab2cc0cea09fc65a9c33ffa8592a2eaf1@149.28.155.8:26656,d494895a1af5760d68566e4febf6d98de62cd575@207.246.72.205:26656"
	StagePersistentPeers = "0f4be2aaa70e9570eee3485d8fa54502cf1a9fc0@34.67.210.7:26656,2f13439b2ee4c34bafe643f89575f40b7863a079@34.136.137.33:26656,c9b1ed3d3040e0c2ac70e3215f0ea9b16b401bca@34.68.24.207:26656,1eec5742f64fb243d22594e4143e14e77a38f232@34.71.167.168:26656,2da43f6e1b5614ea8fc8b7e89909863033ca6a27@35.208.173.168:26656"
	DevPersistentPeers   = "ffad25668e060a357bbe534c8b7e5b4e1274368b@core-discovery-1:26656"
)

const dbUrlLocalPattern string = `^postgresql:\/\/\w+:\w+@(db|localhost):.*`

var isLocalDbUrlRegex = regexp.MustCompile(dbUrlLocalPattern)

var Version string

type Config struct {
	/* Comet Config */
	RootDir          string
	RPCladdr         string
	P2PLaddr         string
	PSQLConn         string
	RetainBlocks     uint
	PersistentPeers  string
	Seeds            string
	ExternalAddress  string
	AddrBookStrict   bool
	MaxInboundPeers  int
	MaxOutboundPeers int

	/* Audius Config */
	Environment     string
	WalletAddress   string
	ProposerAddress string
	GRPCladdr       string
	CoreServerAddr  string
	NodeEndpoint    string

	/* Ethereum Config */
	EthRPCUrl          string
	EthRegistryAddress string

	/* Console Config */
	StandaloneConsole bool

	/* System Config */
	RunDownMigration bool

	/* Derived Config */
	GenesisFile       *types.GenesisDoc
	EthereumKey       *ecdsa.PrivateKey
	CometKey          *ed25519.PrivKey
	NodeType          NodeType
	SlaRollupInterval int
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

	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatalf("Failed to get user home directory: %v", err)
	}

	var cfg Config
	// comet config
	cfg.RootDir = getEnvWithDefault("audius_core_root_dir", homeDir+"/.audiusd")
	cfg.RPCladdr = getEnvWithDefault("rpcLaddr", "tcp://0.0.0.0:26657")
	cfg.P2PLaddr = getEnvWithDefault("p2pLaddr", "tcp://0.0.0.0:26656")

	cfg.GRPCladdr = getEnvWithDefault("grpcLaddr", "0.0.0.0:50051")
	cfg.CoreServerAddr = getEnvWithDefault("coreServerAddr", "0.0.0.0:26659")

	standaloneConsoleStr := getEnvWithDefault("standaloneConsole", "false")
	standaloneConsole, err := strconv.ParseBool(standaloneConsoleStr)
	if err != nil {
		standaloneConsole = false
	}
	cfg.StandaloneConsole = standaloneConsole
	cfg.MaxInboundPeers = getEnvIntWithDefault("maxInboundPeers", 200)
	cfg.MaxOutboundPeers = getEnvIntWithDefault("maxOutboundPeers", 200)

	// check if discovery specific key is set
	isDiscovery := os.Getenv("audius_delegate_private_key") != ""
	var delegatePrivateKey string
	if isDiscovery {
		cfg.NodeType = Discovery
		cfg.Environment = os.Getenv("audius_discprov_env")
		delegatePrivateKey = os.Getenv("audius_delegate_private_key")
		cfg.PSQLConn = getEnvWithDefault("audius_db_url", "postgresql://postgres:postgres@db:5432/audius_discovery")
		cfg.EthRPCUrl = os.Getenv("audius_web3_eth_provider_url")
		cfg.NodeEndpoint = os.Getenv("audius_discprov_url")
	} else {
		cfg.NodeType = Content
		cfg.Environment = os.Getenv("MEDIORUM_ENV")
		delegatePrivateKey = os.Getenv("delegatePrivateKey")
		cfg.PSQLConn = getEnvWithDefault("dbUrl", "postgresql://postgres:postgres@db:5432/audius_creator_node")
		cfg.EthRPCUrl = os.Getenv("ethProviderUrl")
		cfg.NodeEndpoint = os.Getenv("creatorNodeEndpoint")
	}

	ethKey, err := accounts.EthToEthKey(delegatePrivateKey)
	if err != nil {
		return nil, fmt.Errorf("creating eth key %v", err)
	}
	cfg.EthereumKey = ethKey

	ethAddress, err := common.PrivKeyToAddress(ethKey)
	if err != nil {
		return nil, fmt.Errorf("could not get address from priv key: %v", err)
	}
	cfg.WalletAddress = ethAddress

	key, err := accounts.EthToCometKey(cfg.EthereumKey)
	if err != nil {
		return nil, fmt.Errorf("creating key %v", err)
	}
	cfg.CometKey = key

	cfg.AddrBookStrict = true
	switch cfg.Environment {
	case "prod", "production", "mainnet":
		cfg.PersistentPeers = getEnvWithDefault("persistentPeers", ProdPersistentPeers)
		cfg.EthRegistryAddress = ProdRegistryAddress
		if cfg.EthRPCUrl == "" {
			cfg.EthRPCUrl = ProdEthRpc
		}

		cfg.SlaRollupInterval = 3600 * 24

	case "stage", "staging", "testnet":
		cfg.PersistentPeers = getEnvWithDefault("persistentPeers", StagePersistentPeers)
		cfg.EthRegistryAddress = StageRegistryAddress
		if cfg.EthRPCUrl == "" {
			cfg.EthRPCUrl = StageEthRpc
		}
		cfg.SlaRollupInterval = 3600 * 24

	case "dev", "development", "devnet", "local", "sandbox":
		cfg.PersistentPeers = getEnvWithDefault("persistentPeers", DevPersistentPeers)
		cfg.ExternalAddress = os.Getenv("externalAddress")
		cfg.AddrBookStrict = false
		if cfg.EthRPCUrl == "" {
			cfg.EthRPCUrl = DevEthRpc
		}
		if cfg.EthRegistryAddress == "" {
			cfg.EthRegistryAddress = DevRegistryAddress
		}
		cfg.SlaRollupInterval = 12
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

func getEnvIntWithDefault(key string, defaultValue int) int {
	if value, exists := os.LookupEnv(key); exists {
		val, err := strconv.Atoi(value)
		if err == nil {
			return val
		}
		return defaultValue
	}
	return defaultValue
}

func (c *Config) RunDownMigrations() bool {
	if c.StandaloneConsole {
		return false
	}
	return c.RunDownMigration
}
