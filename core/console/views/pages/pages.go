package pages

import (
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/console/views/components"
	"github.com/AudiusProject/audius-protocol/core/console/views/layout"
)

type Pages struct {
	components *components.Components
	layout     *layout.Layout
}

func NewPages(config *config.Config, baseUrl, fragmentUrl string) *Pages {
	return &Pages{
		components: components.NewComponents(config, baseUrl, fragmentUrl),
	}
}
