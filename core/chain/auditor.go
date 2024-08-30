package chain

import (
	"context"
	"errors"
	"reflect"
	"time"

	"github.com/AudiusProject/audius-protocol/core/db"
	gen_proto "github.com/AudiusProject/audius-protocol/core/gen/proto"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const (
	rollupProposalInterval        = time.Minute * 3
	firstRollupMinimumChainHeight = 10
)

func (app *KVStoreApplication) createRollupTx(ctx context.Context, ts time.Time, height int64) ([]byte, error) {
	rollup, err := app.createRollup(ctx, ts, height)
	if err != nil {
		return []byte{}, err
	}
	rollupTx, err := proto.Marshal(&rollup)
	if err != nil {
		return []byte{}, err
	}
	return rollupTx, nil
}

func (app *KVStoreApplication) createRollup(ctx context.Context, timestamp time.Time, height int64) (gen_proto.SlaRollup, error) {
	var rollup gen_proto.SlaRollup
	var start int64 = 0
	appDb := app.getDb()
	latestRollup, err := appDb.GetLatestSlaRollup(ctx)
	if err == nil {
		start = latestRollup.BlockEnd + 1
	}

	reports, err := appDb.GetInProgressRollupReports(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return rollup, err
	}

	rollup = gen_proto.SlaRollup{
		Timestamp:  timestamppb.New(timestamp),
		BlockStart: start,
		BlockEnd:   height - 1, // exclude current block
		Reports:    make([]*gen_proto.SlaNodeReport, 0, len(reports)),
	}
	for _, r := range reports {
		proto_rep := gen_proto.SlaNodeReport{
			Address:           r.Address,
			NumBlocksProposed: r.BlocksProposed,
		}
		rollup.Reports = append(rollup.Reports, &proto_rep)
	}

	return rollup, nil
}

// Checks if the given sla rollup matches our local tallies
func (app *KVStoreApplication) isValidRollup(ctx context.Context, timestamp time.Time, height int64, rollup gen_proto.SlaRollup) (bool, error) {
	if !app.shouldProposeNewRollup(ctx, timestamp, height) {
		return false, nil
	}
	if rollup.BlockStart > rollup.BlockEnd {
		return false, nil
	}

	myRollup, err := app.createRollup(ctx, timestamp, height)
	if err != nil {
		return false, err
	}

	if myRollup.Timestamp.GetSeconds() != rollup.Timestamp.GetSeconds() || myRollup.Timestamp.GetNanos() != rollup.Timestamp.GetNanos() {
		return false, nil
	} else if myRollup.BlockStart != rollup.BlockStart {
		return false, nil
	} else if myRollup.BlockEnd != rollup.BlockEnd {
		return false, nil
	} else if !reflect.DeepEqual(myRollup.Reports, rollup.Reports) {
		return false, nil
	}
	return true, nil
}

func (app *KVStoreApplication) shouldProposeNewRollup(ctx context.Context, ts time.Time, height int64) bool {
	if height < firstRollupMinimumChainHeight {
		return false
	}

	appDb := app.getDb()
	latestRollup, err := appDb.GetLatestSlaRollup(ctx)
	if errors.Is(err, pgx.ErrNoRows) {
		return true
	} else if err != nil {
		app.logger.Error("Error retrieving latest SLA rollup", "error", err)
		return false
	}

	if ts.Sub(latestRollup.Time.Time) >= rollupProposalInterval {
		return true
	}
	return false
}

func (app *KVStoreApplication) indexRollupTx(ctx context.Context, rollupTx []byte) error {
	appDb := app.getDb()
	var rollup gen_proto.SlaRollup
	if err := proto.Unmarshal(rollupTx, &rollup); err != nil {
		return err
	}

	id, err := appDb.IndexSlaRollup(
		ctx,
		db.IndexSlaRollupParams{
			Time: pgtype.Timestamp{
				Time:  rollup.Timestamp.AsTime(),
				Valid: true,
			},
			BlockStart: rollup.BlockStart,
			BlockEnd:   rollup.BlockEnd,
		},
	)
	if err != nil {
		return err
	}

	if err = appDb.ClearUnindexedSlaNodeReports(ctx); err != nil {
		return err
	}

	for _, r := range rollup.Reports {
		if err = appDb.IndexSlaNodeReport(
			ctx,
			db.IndexSlaNodeReportParams{
				Address:        r.Address,
				SlaRollupID:    pgtype.Int4{Int32: id, Valid: true},
				BlocksProposed: r.NumBlocksProposed,
			},
		); err != nil {
			return err
		}
	}
	return nil
}

func (app *KVStoreApplication) isRollupTx(tx []byte) bool {
	var rollup gen_proto.SlaRollup
	if err := proto.Unmarshal(tx, &rollup); err != nil { // not a rollup tx
		return false
	}
	return true
}

func (app *KVStoreApplication) isValidRollupTx(ctx context.Context, timestamp time.Time, height int64, tx []byte) (bool, error) {
	var rollup gen_proto.SlaRollup
	if err := proto.Unmarshal(tx, &rollup); err != nil {
		return false, nil
	}
	return app.isValidRollup(ctx, timestamp, height, rollup)
}
