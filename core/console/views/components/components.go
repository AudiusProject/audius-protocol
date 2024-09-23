package components

import "github.com/AudiusProject/audius-protocol/core/config"

type Components struct {
	config      *config.Config
	baseUrl     string
	fragmentUrl string
}

func NewComponents(config *config.Config, baseUrl string, fragmentUrl string) *Components {
	return &Components{
		config:      config,
		baseUrl:     baseUrl,
		fragmentUrl: fragmentUrl,
	}
}
