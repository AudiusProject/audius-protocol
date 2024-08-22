package components

import (
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/db"
	"github.com/cometbft/cometbft/rpc/client/local"
)

type Components struct {
	config *config.Config
	rpc    *local.Local
	db     *db.Queries
}

func NewComponents(config *config.Config, rpc *local.Local, db *db.Queries) *Components {
	return &Components{
		config: config,
		rpc:    rpc,
		db:     db,
	}
}
