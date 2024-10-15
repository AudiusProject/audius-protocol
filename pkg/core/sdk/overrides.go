/*
Some RPC functions aren't implemented like .Tx() and .TxSearch() because they are disable with the postgres indexer.
This file has re-implementations of those so the SDK can support all RPC methods.
*/
package sdk

import (
	"context"
	"errors"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/proto"
	ctypes "github.com/cometbft/cometbft/rpc/core/types"
)

func (sdk *Sdk) Tx(ctx context.Context, hash []byte, _ bool) (*ctypes.ResultTx, error) {
	result := new(ctypes.ResultTx)

	// TODO return full ResultTx here
	_, err := sdk.GetTransaction(ctx, &proto.GetTransactionRequest{Txhash: string(hash)})
	if err != nil {
		return nil, err
	}

	result.Hash = hash

	return result, nil
}

func (sdk *Sdk) TxSearch(
	ctx context.Context,
	query string,
	prove bool,
	page,
	perPage *int,
	orderBy string,
) (*ctypes.ResultTxSearch, error) {
	return nil, errors.New("unimplemented")
}
