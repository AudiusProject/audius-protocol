package config

import (
	. "trusted-notifier.audius.co/result"
)

type Config struct {
	DbUrl string `yaml:"dbUrl"`
	LogLevel string `yaml:"logLevel"`
	Port int `yaml:"port"`
	RedisPort int `yaml:"redisPort"`
	RedisHost string `yaml:"redisHost"`
	Environment string `yaml:"environment"`

	// Email env var
	EmailAddress string `yaml:"emailAdress"`
	
	// Mailgun env vars
	MailgunApiKey string `yaml:"mailgunApiKey"`
	MailgunPublicKey string `yaml:"mailgunPublicKey"`
	MailgunDomain string `yaml:"mailgunDomain"`
	
	// Functionality env vars
	SenderDomainPassListString string `yaml:"senderDomainPassListString"`
	LabelNameListString string `yaml:"labelNameListString"`

	DiscoveryNodeEndpoint string `yaml:"discoveryNodeEndpoint"`

	PublicSignerAddress string `yaml:"publicSignerAddress"`
	PrivateSignerAddress string `yaml:"privateSignerAddress"`

	AcknowledgersString string `yaml:"acknowledgersString"`
	MaxStrikes int `yaml:"maxStrikes"`
	
	// Audius libs
	DiscoveryNodesPassListString string `yaml:"discoveryNodesPassListString"`
	DiscoveryNodesBlockListString string `yaml:"discoveryNodesBlockListString"`

	EthRegistryAddress string `yaml:"ethRegistryAddress"`
	EthProviderUrl string `yaml:"ethProviderUrl"`
	EthOwnerWallet string `yaml:"ethOwnerWallet"`

	RecognizerTrackPassListString string `yaml:"recognizerTrackPassListString"`
	RecognizerRemixParentPassListString string `yaml:"recognizerRemixParentPassListString"`
}

func New() Result[*Config] {
	return Err[*Config]("unimplemented")
}
