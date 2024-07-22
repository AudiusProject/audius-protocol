package core

// config for a particular node instance
type NodeConfig struct {
	RPCladdr                         string
	P2PLaddr                         string
	MempoolSize                      uint
	MempoolMaxTxBytes                uint
	MempoolMaxTxsBytes               uint
	CreateEmptyBlocks                bool
	CreateEmptyBlocksIntervalSeconds uint
	TimeoutCommitSeconds             uint
	PSQLConn                         string
	Moniker                          string
	RetainBlocks                     uint
}

// network config
type GenesisConfig struct {
	ChainID string
}

// all configs together
type Config struct {
	NodeConfig
	GenesisConfig
}
