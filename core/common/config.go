package common

type AudiusConfig struct {
	DiscoveryDelegatePrivateKey string `env:"audius_delegate_private_key" envconfig:"optional"`
	ContentDelegatePrivateKey   string `env:"delegatePrivateKey" envconfig:"optional"`
}

// config for a particular node instance
type NodeConfig struct {
	HomeDir                          string
	RPCladdr                         string
	P2PLaddr                         string
	MempoolSize                      uint
	MempoolMaxTxBytes                uint
	MempoolMaxTxsBytes               uint
	CreateEmptyBlocks                bool
	CreateEmptyBlocksIntervalSeconds uint
	TimeoutCommitSeconds             uint
	PSQLConn                         string
	RetainBlocks                     uint
}

// network config
type GenesisConfig struct {
	Environment string
}

// all configs together
type Config struct {
	NodeConfig
	GenesisConfig
	AudiusConfig
}
