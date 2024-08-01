package chain

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"

	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/db"
	abcitypes "github.com/cometbft/cometbft/abci/types"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type KVStoreApplication struct {
	logger       *common.Logger
	queries      *db.Queries
	pool         *pgxpool.Pool
	onGoingBlock pgx.Tx
}

var _ abcitypes.Application = (*KVStoreApplication)(nil)

func NewKVStoreApplication(logger *common.Logger, pool *pgxpool.Pool) *KVStoreApplication {
	return &KVStoreApplication{
		logger:       logger,
		queries:      db.New(pool),
		pool:         pool,
		onGoingBlock: nil,
	}
}

func (app *KVStoreApplication) Info(_ context.Context, info *abcitypes.InfoRequest) (*abcitypes.InfoResponse, error) {
	return &abcitypes.InfoResponse{}, nil
}

func (app *KVStoreApplication) Query(ctx context.Context, req *abcitypes.QueryRequest) (*abcitypes.QueryResponse, error) {
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

func (app *KVStoreApplication) CheckTx(_ context.Context, check *abcitypes.CheckTxRequest) (*abcitypes.CheckTxResponse, error) {
	code := app.isValid(check.Tx)
	return &abcitypes.CheckTxResponse{Code: code}, nil
}

func (app *KVStoreApplication) InitChain(_ context.Context, chain *abcitypes.InitChainRequest) (*abcitypes.InitChainResponse, error) {
	return &abcitypes.InitChainResponse{}, nil
}

func (app *KVStoreApplication) PrepareProposal(_ context.Context, proposal *abcitypes.PrepareProposalRequest) (*abcitypes.PrepareProposalResponse, error) {
	return &abcitypes.PrepareProposalResponse{Txs: proposal.Txs}, nil
}

func (app *KVStoreApplication) ProcessProposal(_ context.Context, proposal *abcitypes.ProcessProposalRequest) (*abcitypes.ProcessProposalResponse, error) {
	return &abcitypes.ProcessProposalResponse{Status: abcitypes.PROCESS_PROPOSAL_STATUS_ACCEPT}, nil
}

func (app *KVStoreApplication) FinalizeBlock(ctx context.Context, req *abcitypes.FinalizeBlockRequest) (*abcitypes.FinalizeBlockResponse, error) {
	logger := app.logger
	var txs = make([]*abcitypes.ExecTxResult, len(req.Txs))

	// early out if empty block
	if len(txs) == 0 {
		return &abcitypes.FinalizeBlockResponse{
			TxResults: txs,
		}, nil
	}

	// open in progres pg transaction
	app.startInProgressTx(ctx)
	for i, tx := range req.Txs {
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

	return &abcitypes.FinalizeBlockResponse{
		TxResults: txs,
	}, nil
}

func (app KVStoreApplication) Commit(ctx context.Context, commit *abcitypes.CommitRequest) (*abcitypes.CommitResponse, error) {
	app.logger.Info("in commit phase", "onGoingBlock", app.onGoingBlock)
	if err := app.commitInProgressTx(ctx); err != nil {
		app.logger.Error("failure to commit tx", "error", err)
		return &abcitypes.CommitResponse{}, err
	}
	return &abcitypes.CommitResponse{}, nil
}

func (app *KVStoreApplication) ListSnapshots(_ context.Context, snapshots *abcitypes.ListSnapshotsRequest) (*abcitypes.ListSnapshotsResponse, error) {
	return &abcitypes.ListSnapshotsResponse{}, nil
}

func (app *KVStoreApplication) OfferSnapshot(_ context.Context, snapshot *abcitypes.OfferSnapshotRequest) (*abcitypes.OfferSnapshotResponse, error) {
	return &abcitypes.OfferSnapshotResponse{}, nil
}

func (app *KVStoreApplication) LoadSnapshotChunk(_ context.Context, chunk *abcitypes.LoadSnapshotChunkRequest) (*abcitypes.LoadSnapshotChunkResponse, error) {
	return &abcitypes.LoadSnapshotChunkResponse{}, nil
}

func (app *KVStoreApplication) ApplySnapshotChunk(_ context.Context, chunk *abcitypes.ApplySnapshotChunkRequest) (*abcitypes.ApplySnapshotChunkResponse, error) {
	return &abcitypes.ApplySnapshotChunkResponse{Result: abcitypes.APPLY_SNAPSHOT_CHUNK_RESULT_ACCEPT}, nil
}

func (app KVStoreApplication) ExtendVote(_ context.Context, extend *abcitypes.ExtendVoteRequest) (*abcitypes.ExtendVoteResponse, error) {
	return &abcitypes.ExtendVoteResponse{}, nil
}

func (app *KVStoreApplication) VerifyVoteExtension(_ context.Context, verify *abcitypes.VerifyVoteExtensionRequest) (*abcitypes.VerifyVoteExtensionResponse, error) {
	return &abcitypes.VerifyVoteExtensionResponse{}, nil
}

func (app *KVStoreApplication) isValid(tx []byte) uint32 {
	// check format
	parts := bytes.Split(tx, []byte("="))
	if len(parts) != 2 {
		return 1
	}

	return 0
}
