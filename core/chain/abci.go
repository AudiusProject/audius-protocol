package chain

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/contracts"
	"github.com/AudiusProject/audius-protocol/core/db"
	gen_proto "github.com/AudiusProject/audius-protocol/core/gen/proto"
	abcitypes "github.com/cometbft/cometbft/abci/types"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/protobuf/proto"
)

type CoreApplication struct {
	logger       *common.Logger
	queries      *db.Queries
	contracts    *contracts.AudiusContracts
	pool         *pgxpool.Pool
	onGoingBlock pgx.Tx
}

var _ abcitypes.Application = (*CoreApplication)(nil)

func NewCoreApplication(logger *common.Logger, pool *pgxpool.Pool, contracts *contracts.AudiusContracts) *CoreApplication {
	return &CoreApplication{
		logger:       logger,
		queries:      db.New(pool),
		contracts:    contracts,
		pool:         pool,
		onGoingBlock: nil,
	}
}

func (app *CoreApplication) Info(ctx context.Context, info *abcitypes.InfoRequest) (*abcitypes.InfoResponse, error) {
	latest, err := app.queries.GetLatestAppState(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		// Log the error and return a default response
		app.logger.Errorf("Error retrieving app state: %v", err)
		return nil, err
	}

	// if at genesis, tell comet there's no blocks indexed
	if latest.BlockHeight < 2 {
		return &abcitypes.InfoResponse{}, nil
	}

	app.logger.Infof("app starting at block %d with hash %s", latest.BlockHeight, hex.EncodeToString(latest.AppHash))

	res := &abcitypes.InfoResponse{
		LastBlockHeight:  latest.BlockHeight,
		LastBlockAppHash: latest.AppHash,
	}

	return res, nil
}

func (app *CoreApplication) Query(ctx context.Context, req *abcitypes.QueryRequest) (*abcitypes.QueryResponse, error) {
	resp := abcitypes.QueryResponse{Key: req.Data}

	kv, err := app.queries.GetKey(ctx, string(req.Data))
	if err != nil {
		resp.Log = err.Error()
		return &resp, err
	}

	value := []byte(kv.Value)
	resp.Log = "exists"
	resp.Value = value

	return &resp, nil
}

func (app *CoreApplication) CheckTx(_ context.Context, check *abcitypes.CheckTxRequest) (*abcitypes.CheckTxResponse, error) {
	// check if protobuf event
	_, err := app.isValidProtoEvent(check.Tx)
	if err == nil {
		return &abcitypes.CheckTxResponse{Code: abcitypes.CodeTypeOK}, nil
	}
	// else check if kv store tx, this is hacky and kv store should be in protobuf if we later want to keep it
	code := app.isValid(check.Tx)
	return &abcitypes.CheckTxResponse{Code: code}, nil
}

func (app *CoreApplication) InitChain(_ context.Context, chain *abcitypes.InitChainRequest) (*abcitypes.InitChainResponse, error) {
	return &abcitypes.InitChainResponse{}, nil
}

func (app *CoreApplication) PrepareProposal(_ context.Context, proposal *abcitypes.PrepareProposalRequest) (*abcitypes.PrepareProposalResponse, error) {
	return &abcitypes.PrepareProposalResponse{Txs: proposal.Txs}, nil
}

func (app *CoreApplication) ProcessProposal(_ context.Context, proposal *abcitypes.ProcessProposalRequest) (*abcitypes.ProcessProposalResponse, error) {
	return &abcitypes.ProcessProposalResponse{Status: abcitypes.PROCESS_PROPOSAL_STATUS_ACCEPT}, nil
}

func (app *CoreApplication) FinalizeBlock(ctx context.Context, req *abcitypes.FinalizeBlockRequest) (*abcitypes.FinalizeBlockResponse, error) {
	logger := app.logger
	var txs = make([]*abcitypes.ExecTxResult, len(req.Txs))

	// open in progres pg transaction
	app.startInProgressTx(ctx)
	for i, tx := range req.Txs {
		protoEvent, err := app.isValidProtoEvent(tx)
		if err == nil {
			if err := app.finalizeEvent(ctx, protoEvent); err != nil {
				app.logger.Errorf("error finalizing event: %v", err)
				txs[i] = &abcitypes.ExecTxResult{Code: 2}
			}
			txs[i] = &abcitypes.ExecTxResult{Code: abcitypes.CodeTypeOK}
			continue
		}

		if code := app.isValid(tx); code != 0 {
			logger.Errorf("Error: invalid transaction index %v", i)
			txs[i] = &abcitypes.ExecTxResult{Code: code}
		} else {
			parts := bytes.SplitN(tx, []byte("="), 2)
			key, value := parts[0], parts[1]
			logger.Infof("Adding key %s with value %s", key, value)

			qtx := app.getDb()

			hash := sha256.Sum256(tx)
			txHash := hex.EncodeToString(hash[:])

			params := db.InsertKVStoreParams{
				Key:    string(key),
				Value:  string(value),
				TxHash: txHash,
			}

			record, err := qtx.InsertKVStore(ctx, params)
			if err != nil {
				logger.Errorf("failed to persisted kv entry %v", err)
			}

			txs[i] = &abcitypes.ExecTxResult{
				Code: 0,
				Events: []abcitypes.Event{
					{
						Type: "app",
						Attributes: []abcitypes.EventAttribute{
							{Key: "key", Value: record.Key, Index: true},
							{Key: "value", Value: record.Value, Index: true},
						},
					},
				},
			}
		}
	}

	prevAppState, err := app.getDb().GetAppStateAtHeight(ctx, req.Height-1)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		app.logger.Errorf("prev app state not found: %v", err)
		return &abcitypes.FinalizeBlockResponse{}, nil
	}

	nextAppHash := app.serializeAppState(prevAppState.AppHash, req.GetTxs())
	// if empty block and previous was not genesis, use prior state
	if len(txs) == 0 && req.Height > 2 {
		nextAppHash = prevAppState.AppHash
	}

	if err = app.getDb().UpsertAppState(ctx, db.UpsertAppStateParams{
		BlockHeight: req.Height,
		AppHash:     nextAppHash,
	}); err != nil {
		app.logger.Errorf("error upserting app state %v", err)
	}

	return &abcitypes.FinalizeBlockResponse{
		TxResults: txs,
		AppHash:   nextAppHash,
	}, nil
}

func (app CoreApplication) Commit(ctx context.Context, commit *abcitypes.CommitRequest) (*abcitypes.CommitResponse, error) {
	app.logger.Info("in commit phase", "onGoingBlock", app.onGoingBlock)
	if err := app.commitInProgressTx(ctx); err != nil {
		app.logger.Error("failure to commit tx", "error", err)
		return &abcitypes.CommitResponse{}, err
	}
	return &abcitypes.CommitResponse{}, nil
}

func (app *CoreApplication) ListSnapshots(_ context.Context, snapshots *abcitypes.ListSnapshotsRequest) (*abcitypes.ListSnapshotsResponse, error) {
	return &abcitypes.ListSnapshotsResponse{}, nil
}

func (app *CoreApplication) OfferSnapshot(_ context.Context, snapshot *abcitypes.OfferSnapshotRequest) (*abcitypes.OfferSnapshotResponse, error) {
	return &abcitypes.OfferSnapshotResponse{}, nil
}

func (app *CoreApplication) LoadSnapshotChunk(_ context.Context, chunk *abcitypes.LoadSnapshotChunkRequest) (*abcitypes.LoadSnapshotChunkResponse, error) {
	return &abcitypes.LoadSnapshotChunkResponse{}, nil
}

func (app *CoreApplication) ApplySnapshotChunk(_ context.Context, chunk *abcitypes.ApplySnapshotChunkRequest) (*abcitypes.ApplySnapshotChunkResponse, error) {
	return &abcitypes.ApplySnapshotChunkResponse{Result: abcitypes.APPLY_SNAPSHOT_CHUNK_RESULT_ACCEPT}, nil
}

func (app CoreApplication) ExtendVote(_ context.Context, extend *abcitypes.ExtendVoteRequest) (*abcitypes.ExtendVoteResponse, error) {
	return &abcitypes.ExtendVoteResponse{}, nil
}

func (app *CoreApplication) VerifyVoteExtension(_ context.Context, verify *abcitypes.VerifyVoteExtensionRequest) (*abcitypes.VerifyVoteExtensionResponse, error) {
	return &abcitypes.VerifyVoteExtensionResponse{}, nil
}

func (app *CoreApplication) isValid(tx []byte) uint32 {
	// check format
	parts := bytes.Split(tx, []byte("="))
	if len(parts) != 2 {
		return 1
	}

	return 0
}

func (app *CoreApplication) isValidProtoEvent(tx []byte) (*gen_proto.Event, error) {
	var msg gen_proto.Event
	err := proto.Unmarshal(tx, &msg)
	if err != nil {
		return nil, err
	}
	return &msg, nil
}
