package console

import (
	"context"
	"encoding/hex"
	"fmt"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/console/views/pages"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/grpc"
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
	latestBlocks       []pages.BlockView
	latestTransactions []db.CoreTxResult

	totalBlocks         int64
	totalTransactions   int64
	totalPlays          int64
	totalValidators     int64
	totalManageEntities int64

	isSyncing bool

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

		newBlockChan: newBlocksChan,
		newTxChan:    newTxsChan,
		chainId:      config.GenesisFile.ChainID,
		ethAddress:   config.WalletAddress,
		cometAddress: config.ProposerAddress,
	}, nil
}

func (state *State) recalculateState() {
	ctx := context.Background()
	logger := state.logger

	state.latestTenBlocks()

	recentTransactions, err := state.db.GetRecentTxs(ctx)
	if err != nil {
		logger.Errorf("could not get recent txs: %v", err)
	} else {
		state.latestTransactions = recentTransactions
	}

	// on initial load
	totalTxs, err := state.db.TotalTransactions(ctx)
	if err != nil {
		logger.Errorf("could not get total txs: %v", err)
	} else {
		state.totalTransactions = totalTxs
	}

	totalBlocks, err := state.db.TotalBlocks(ctx)
	if err != nil {
		logger.Errorf("could not get total blocks: %v", err)
	} else {
		state.totalBlocks = totalBlocks
	}

	totalPlays, err := state.db.TotalTransactionsByType(ctx, grpc.TrackPlaysProtoName)
	if err != nil {
		logger.Errorf("could not get total plays: %v", err)
	} else {
		state.totalPlays = totalPlays
	}

	totalManageEntities, err := state.db.TotalTransactionsByType(ctx, grpc.ManageEntitiesProtoName)
	if err != nil {
		logger.Errorf("could not get total manage entities: %v", err)
	} else {
		state.totalManageEntities = totalManageEntities
	}

	totalValidators, err := state.db.TotalValidators(ctx)
	if err != nil {
		logger.Errorf("could not get total validators: %v", err)
	} else {
		state.totalValidators = totalValidators
	}

	status, err := state.rpc.Status(ctx)
	if err == nil {
		state.isSyncing = status.SyncInfo.CatchingUp
	}
}

func (state *State) latestTenBlocks() {
	client := state.rpc
	status, err := client.Status(context.Background())
	if err != nil {
		state.logger.Errorf("failed to get status: %v", err)
	}

	latestHeight := status.SyncInfo.LatestBlockHeight
	fmt.Printf("Latest Block Height: %d\n", latestHeight)

	latestBlocks := []pages.BlockView{}

	// Fetch the last 10 blocks
	for height := latestHeight; height > latestHeight-10 && height > 0; height-- {
		blockResult, err := client.Block(context.Background(), &height)
		if err != nil {
			state.logger.Errorf("failed to get block at height %d: %v", height, err)
		}

		block := blockResult.Block
		latestBlocks = append(latestBlocks, pages.BlockView{
			Height:    fmt.Sprint(block.Height),
			Hash:      hex.EncodeToString(block.Hash()),
			Proposer:  block.Header.ProposerAddress.String(),
			Timestamp: block.Time,
			Txs:       block.Txs.ToSliceOfBytes(),
		})
	}

	state.latestBlocks = latestBlocks
}

func (state *State) Start() error {
	state.recalculateState()

	for {
		newBlock := false
		newTx := false

		select {
		case <-state.newBlockChan:
			newBlock = true
		case <-state.newTxChan:
			newTx = true
		}

		newEvent := newBlock || newTx
		if newEvent {
			state.recalculateState()
		}
	}
}
