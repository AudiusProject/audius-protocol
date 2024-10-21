package layout

import (
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/console/views/components"
)

type Layout struct {
	config     *config.Config
	baseUrl    string
	components *components.Components
}

func NewLayout(config *config.Config, baseUrl string) *Layout {
	return &Layout{
		config:     config,
		baseUrl:    baseUrl,
		components: components.NewComponents(config, baseUrl),
	}
}
