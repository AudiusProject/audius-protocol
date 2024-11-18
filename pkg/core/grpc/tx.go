package grpc

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	abcitypes "github.com/cometbft/cometbft/abci/types"
	"github.com/cometbft/cometbft/rpc/client/local"
	"github.com/cometbft/cometbft/types"
	"google.golang.org/protobuf/proto"
)

type TxHash = string

func SendTx[T proto.Message](logger *common.Logger, rpc *local.Local, msg T) (TxHash, error) {
	ctx := context.Background()

	tx, err := proto.Marshal(msg)
	if err != nil {
		return "", err
	}

	return SendRawTx(ctx, logger, rpc, tx)
}

func ListenForTx(ctx context.Context, logger *common.Logger, rpc *local.Local, txhash string) (TxHash, error) {
	txChan, err := rpc.Subscribe(ctx, "tx-subscriber", fmt.Sprintf("tm.event = 'Tx' AND tx.hash = '%X'", txhash))
	if err != nil {
		return "", err
	}

	defer func() {
		if err := rpc.Unsubscribe(ctx, "tx-subscriber", fmt.Sprintf("tm.event = 'Tx' AND tx.hash = '%X'", txhash)); err != nil {
			// Handle the unsubscribe error if necessary
			logger.Errorf("Failed to unsubscribe: %v", err)
		}
	}()

	select {
	case txRes := <-txChan:
		etx := txRes.Data.(types.EventDataTx)
		if etx.TxResult.Result.Code != abcitypes.CodeTypeOK {
			return "", fmt.Errorf("tx %s failed to index", txhash)
		}
		return txhash, nil
	case <-time.After(30 * time.Second):
		return "", errors.New("tx waiting timeout")
	}
}

func SendRawTx(ctx context.Context, logger *common.Logger, rpc *local.Local, tx []byte) (TxHash, error) {
	result, err := rpc.BroadcastTxSync(ctx, tx)
	if err != nil {
		return "", err
	}

	if result.Code != abcitypes.CodeTypeOK {
		return "", errors.New(result.Log)
	}

	txChan, err := rpc.Subscribe(ctx, "tx-subscriber", fmt.Sprintf("tm.event = 'Tx' AND tx.hash = '%X'", result.Hash))
	if err != nil {
		return "", err
	}

	logger.Info("txhash", "txhashStr", result.Hash.String(), "txhashBytes", result.Hash)

	defer func() {
		if err := rpc.Unsubscribe(ctx, "tx-subscriber", fmt.Sprintf("tm.event = 'Tx' AND tx.hash = '%X'", result.Hash)); err != nil {
			// Handle the unsubscribe error if necessary
			fmt.Println("Failed to unsubscribe:", err)
		}
	}()

	select {
	case txRes := <-txChan:
		etx := txRes.Data.(types.EventDataTx)
		if etx.TxResult.Result.Code != abcitypes.CodeTypeOK {
			return "", fmt.Errorf("tx %s failed to index", result.Hash)
		}
		return result.Hash.String(), nil
	case <-time.After(30 * time.Second):
		return "", errors.New("tx waiting timeout")
	}
}

func ToTxHash(msg proto.Message) (TxHash, error) {
	return common.ToTxHash(msg)
}
