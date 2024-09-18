package components

import (
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/db"
	"github.com/cometbft/cometbft/rpc/client"
)

type Components struct {
	config *config.Config
	rpc    client.Client
	db     *db.Queries
}

func NewComponents(config *config.Config, rpc client.Client, db *db.Queries) *Components {
	return &Components{
		config: config,
		rpc:    rpc,
		db:     db,
	}
}
