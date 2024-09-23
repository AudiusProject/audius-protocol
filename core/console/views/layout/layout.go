package layout

import (
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/console/views/components"
)

type Layout struct {
	config     *config.Config
	baseUrl    string
	components *components.Components
}

func NewLayout(config *config.Config, baseUrl string, fragmentUrl string) *Layout {
	return &Layout{
		config:     config,
		baseUrl:    baseUrl,
		components: components.NewComponents(config, baseUrl, fragmentUrl),
	}
}
