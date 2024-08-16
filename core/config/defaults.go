package config

const (
	DefaultRPCAddress             = "tcp://0.0.0.0:26657"
	DefaultP2PAddress             = "tcp://0.0.0.0:26656"
	DefaultTestnetPersistentPeers = "0f4be2aaa70e9570eee3485d8fa54502cf1a9fc0@34.67.210.7:26656"

	DefaultDiscoveryPostgresConnectionString = "postgresql://postgres:postgres@db:5432/audius_discovery"
	DefaultContentPostgresConnectionString   = "postgres://postgres:postgres@db:5432/audius_creator_node"
)
