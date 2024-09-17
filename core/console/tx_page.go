package console

import (
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/console/components"
	"github.com/AudiusProject/audius-protocol/core/console/utils"
	gen_proto "github.com/AudiusProject/audius-protocol/core/gen/proto"
	abci "github.com/cometbft/cometbft/abci/types"
	gogo_proto "github.com/cosmos/gogoproto/proto"
	"github.com/labstack/echo/v4"
	"google.golang.org/protobuf/proto"
)

func (cs *Console) txPage(c echo.Context) error {
	ctx := c.Request().Context()
	txhash := c.Param("tx")

	tx, err := cs.db.GetTx(ctx, txhash)
	if err != nil {
		cs.logger.Errorf("err getting tx: %v", err)
		return err
	}

	txType, txData := gatherTxMetadata(tx.TxResult)

	comp := cs.c.TxPage(components.TxPageProps{
		Hash:      txhash,
		Height:    fmt.Sprint(tx.BlockID),
		Timestamp: tx.CreatedAt.Time,
		TxType:    txType,
		TxData:    txData,
	})
	return utils.Render(c, comp)
}

// utility function to gather different tx type metadata into json like structure
func gatherTxMetadata(txResult []byte) (string, map[string]string) {
	txType := "unknown"
	data := make(map[string]string)

	var result abci.TxResult
	err := gogo_proto.Unmarshal(txResult, &result)
	if err != nil {
		return txType, data
	}

	tx := result.Tx

	var transaction gen_proto.SignedTransaction
	err = proto.Unmarshal(tx, &transaction)
	if err != nil {
		return txType, data
	}

	switch transaction.Transaction.(type) {
	case *gen_proto.SignedTransaction_Plays:
		playsEvent := transaction.GetPlays()

		txType = "Play Event"

		// only one play per event for now
		for _, listen := range playsEvent.Plays {
			data["Track ID"] = listen.TrackId
			data["User ID"] = listen.UserId
			data["Signature"] = listen.Signature
			data["Timestamp"] = listen.Timestamp.String()
		}
	}

	return txType, data
}
