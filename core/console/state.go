package console

import (
	"context"
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/db"
	v1 "github.com/cometbft/cometbft/api/cometbft/abci/v1"
	"github.com/cometbft/cometbft/rpc/client"
	coretypes "github.com/cometbft/cometbft/rpc/core/types"
	"github.com/cometbft/cometbft/types"
)

type State struct {
	rpc    client.Client
	logger *common.Logger
	db     *db.Queries

	newBlockChan       <-chan coretypes.ResultEvent
	newTxChan          <-chan coretypes.ResultEvent
	latestBlocks       []*types.Block
	latestTransactions []*v1.ExecTxResult

	totalBlocks       int64
	totalTransactions int64
	isCatchingUp      bool

	chainId      string
	ethAddress   string
	cometAddress string
}

func NewState(config *config.Config, rpc client.Client, logger *common.Logger, db *db.Queries) (*State, error) {
	newBlocksChan, err := rpc.Subscribe(context.Background(), "new-block-subscriber", types.EventQueryNewBlock.String())
	if err != nil {
		return nil, fmt.Errorf("could not create block subscriber: %v", err)
	}

	newTxsChan, err := rpc.Subscribe(context.Background(), "new-tx-subscriber", types.EventQueryTx.String())
	if err != nil {
		return nil, fmt.Errorf("could not create transaction subscriber: %v", err)
	}

	return &State{
		rpc:    rpc,
		logger: logger,
		db:     db,

		newBlockChan:       newBlocksChan,
		newTxChan:          newTxsChan,
		latestBlocks:       []*types.Block{},
		latestTransactions: []*v1.ExecTxResult{},
		chainId:            config.GenesisFile.ChainID,
		ethAddress:         config.WalletAddress,
		cometAddress:       config.ProposerAddress,
	}, nil
}

func (state *State) Start() error {
	logger := state.logger
	for {
		newBlock := false
		newTx := false

		select {
		case newBlockEvent := <-state.newBlockChan:
			blockEvent, ok := newBlockEvent.Data.(types.EventDataNewBlock)
			if ok {
				newBlock = true
				block := blockEvent.Block
				state.latestBlocks = append(state.latestBlocks, block)
				if len(state.latestBlocks) > 10 {
					state.latestBlocks = state.latestBlocks[len(state.latestBlocks)-10:]
				}
			}
		case newTxEvent := <-state.newTxChan:
			txEvent, ok := newTxEvent.Data.(types.EventDataTx)
			if ok {
				newTx = true
				txResult := txEvent.GetResult()
				state.latestTransactions = append(state.latestTransactions, &txResult)
				if len(state.latestTransactions) > 10 {
					state.latestTransactions = state.latestTransactions[len(state.latestTransactions)-10:]
				}
			}
		}

		newEvent := newBlock || newTx
		if newEvent {
			logger.Infof("total things %v %v", len(state.latestBlocks), len(state.latestTransactions))
		}
	}
}
