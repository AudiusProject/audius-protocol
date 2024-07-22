package chain

import (
	"context"

	abcitypes "github.com/cometbft/cometbft/abci/types"
)

type ABCICore struct {
}

func NewABCICore() *ABCICore {
	return &ABCICore{}
}

// ApplySnapshotChunk implements types.Application.
func (a *ABCICore) ApplySnapshotChunk(context.Context, *abcitypes.ApplySnapshotChunkRequest) (*abcitypes.ApplySnapshotChunkResponse, error) {
	panic("unimplemented")
}

// CheckTx implements types.Application.
func (a *ABCICore) CheckTx(ctx context.Context, req *abcitypes.CheckTxRequest) (*abcitypes.CheckTxResponse, error) {
	return &abcitypes.CheckTxResponse{Code: abcitypes.CodeTypeOK}, nil
}

// Commit implements types.Application.
func (a *ABCICore) Commit(context.Context, *abcitypes.CommitRequest) (*abcitypes.CommitResponse, error) {
	panic("unimplemented")
}

// ExtendVote implements types.Application.
func (a *ABCICore) ExtendVote(context.Context, *abcitypes.ExtendVoteRequest) (*abcitypes.ExtendVoteResponse, error) {
	panic("unimplemented")
}

// FinalizeBlock implements types.Application.
func (a *ABCICore) FinalizeBlock(context.Context, *abcitypes.FinalizeBlockRequest) (*abcitypes.FinalizeBlockResponse, error) {
	panic("unimplemented")
}

// Info implements types.Application.
func (a *ABCICore) Info(context.Context, *abcitypes.InfoRequest) (*abcitypes.InfoResponse, error) {
	panic("unimplemented")
}

// InitChain implements types.Application.
func (a *ABCICore) InitChain(context.Context, *abcitypes.InitChainRequest) (*abcitypes.InitChainResponse, error) {
	panic("unimplemented")
}

// ListSnapshots implements types.Application.
func (a *ABCICore) ListSnapshots(context.Context, *abcitypes.ListSnapshotsRequest) (*abcitypes.ListSnapshotsResponse, error) {
	panic("unimplemented")
}

// LoadSnapshotChunk implements types.Application.
func (a *ABCICore) LoadSnapshotChunk(context.Context, *abcitypes.LoadSnapshotChunkRequest) (*abcitypes.LoadSnapshotChunkResponse, error) {
	panic("unimplemented")
}

// OfferSnapshot implements types.Application.
func (a *ABCICore) OfferSnapshot(context.Context, *abcitypes.OfferSnapshotRequest) (*abcitypes.OfferSnapshotResponse, error) {
	panic("unimplemented")
}

// PrepareProposal implements types.Application.
func (a *ABCICore) PrepareProposal(context.Context, *abcitypes.PrepareProposalRequest) (*abcitypes.PrepareProposalResponse, error) {
	panic("unimplemented")
}

// ProcessProposal implements types.Application.
func (a *ABCICore) ProcessProposal(context.Context, *abcitypes.ProcessProposalRequest) (*abcitypes.ProcessProposalResponse, error) {
	panic("unimplemented")
}

// Query implements types.Application.
func (a *ABCICore) Query(context.Context, *abcitypes.QueryRequest) (*abcitypes.QueryResponse, error) {
	panic("unimplemented")
}

// VerifyVoteExtension implements types.Application.
func (a *ABCICore) VerifyVoteExtension(context.Context, *abcitypes.VerifyVoteExtensionRequest) (*abcitypes.VerifyVoteExtensionResponse, error) {
	panic("unimplemented")
}

var _ abcitypes.Application = (*ABCICore)(nil)
