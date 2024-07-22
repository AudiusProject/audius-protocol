package core

import (
	"context"

	"github.com/AudiusProject/audius-protocol/core/pkg/chain"
	"github.com/AudiusProject/audius-protocol/core/pkg/utils"
	abcitypes "github.com/cometbft/cometbft/abci/types"
)

// these are meant for node types to implement per their own requirements
// example: on track upload content validates media exists, discovery validates metadata is good
type CoreOverrides interface {
	// runs before insertion into the mempool and prior to finalizing a block
	ValidateTx(context.Context, *abcitypes.CheckTxRequest) (*abcitypes.CheckTxResponse, error)
	// runs arbitrary logic to determine if the node needs to prune
	// say dns can't index something but content can, content can prune while discovery holds until it's good
	Prune(context.Context) bool
}

type Core struct {
	abci   *chain.ABCICore
	config *utils.Config
}

func NewCore(config *utils.Config, overrides CoreOverrides) *Core {
	return &Core{
		abci:   chain.NewABCICore(),
		config: config,
	}
}
