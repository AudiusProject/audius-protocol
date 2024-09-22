package layout

import "github.com/AudiusProject/audius-protocol/core/config"

type Layout struct {
	config  *config.Config
	baseUrl string
}

func NewLayout(config *config.Config, baseUrl string) *Layout {
	return &Layout{
		config:  config,
		baseUrl: baseUrl,
	}
}
