package core

import (
	"context"

	abcitypes "github.com/cometbft/cometbft/abci/types"
)

func Hello(name string) string {
	return "Hello, " + name
}

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
	abci   *ABCICore
	config *Config
}

func NewCore(config *Config, overrides CoreOverrides) *Core {
	return &Core{
		abci:   NewABCICore(overrides),
		config: config,
	}
}
