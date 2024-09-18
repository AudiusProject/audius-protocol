package htmlviews

import (
	"encoding/hex"
	"fmt"

	"github.com/AudiusProject/audius-protocol/core/db"
	coretypes "github.com/cometbft/cometbft/rpc/core/types"
	"github.com/labstack/echo/v4"
)

func BlockPageHTML(c echo.Context, block *coretypes.ResultBlock) error {
	txResults := []*TxProps{}
	for _, tx := range block.Block.Txs {
		txResults = append(txResults, &TxProps{
			Block:     block.Block.Height,
			Hash:      hex.EncodeToString(tx.Hash()),
			GasUsed:   0,
			Timestamp: block.Block.Time,
		})
	}

	return Render(c, BlockPage(BlockPageProps{
		Hash:      hex.EncodeToString(block.Block.Hash()),
		Height:    fmt.Sprint(block.Block.Height),
		Timestamp: block.Block.Time,
		Txs:       txResults,
	}))
}

func SlaPageHTML(c echo.Context, rollup db.SlaRollup, reports []db.SlaNodeReport, recentRollups []db.SlaRollup) error {
	return Render(c, SlaPage(SlaPageProps{
		Rollup:        rollup,
		Reports:       reports,
		RecentRollups: recentRollups,
	}))
}
