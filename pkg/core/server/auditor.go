package server

import (
	"context"
	"errors"
	"reflect"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func (s *Server) createRollupTx(ctx context.Context, ts time.Time, height int64) ([]byte, error) {
	rollup, err := s.createRollup(ctx, ts, height)
	if err != nil {
		return []byte{}, err
	}
	e := core_proto.SignedTransaction{
		Transaction: &core_proto.SignedTransaction_SlaRollup{
			SlaRollup: rollup,
		},
	}
	rollupTx, err := proto.Marshal(&e)
	if err != nil {
		return []byte{}, err
	}
	return rollupTx, nil
}

func (s *Server) createRollup(ctx context.Context, timestamp time.Time, height int64) (*core_proto.SlaRollup, error) {
	var rollup *core_proto.SlaRollup
	var start int64 = 0
	latestRollup, err := s.db.GetLatestSlaRollup(ctx)
	if err == nil {
		start = latestRollup.BlockEnd + 1
	}

	reports, err := s.db.GetInProgressRollupReports(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return rollup, err
	}

	rollup = &core_proto.SlaRollup{
		Timestamp:  timestamppb.New(timestamp),
		BlockStart: start,
		BlockEnd:   height - 1, // exclude current block
		Reports:    make([]*core_proto.SlaNodeReport, 0, len(reports)),
	}
	for _, r := range reports {
		proto_rep := core_proto.SlaNodeReport{
			Address:           r.Address,
			NumBlocksProposed: r.BlocksProposed,
		}
		rollup.Reports = append(rollup.Reports, &proto_rep)
	}

	return rollup, nil
}

// Checks if the given sla rollup matches our local tallies
func (s *Server) isValidRollup(ctx context.Context, timestamp time.Time, height int64, rollup *core_proto.SlaRollup) (bool, error) {
	if !s.shouldProposeNewRollup(ctx, height) {
		return false, nil
	}
	if rollup.BlockStart > rollup.BlockEnd {
		return false, nil
	}

	myRollup, err := s.createRollup(ctx, timestamp, height)
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

func (s *Server) shouldProposeNewRollup(ctx context.Context, height int64) bool {
	previousHeight := int64(0)
	latestRollup, err := s.db.GetLatestSlaRollup(ctx)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		s.logger.Error("Error retrieving latest SLA rollup", "error", err)
		return false
	} else {
		previousHeight = latestRollup.BlockEnd
	}
	return height-previousHeight >= int64(s.config.SlaRollupInterval)
}

func (s *Server) finalizeSlaRollup(ctx context.Context, event *core_proto.SignedTransaction, txHash string) (*core_proto.SlaRollup, error) {
	appDb := s.getDb()
	rollup := event.GetSlaRollup()

	id, err := appDb.CommitSlaRollup(
		ctx,
		db.CommitSlaRollupParams{
			Time: pgtype.Timestamp{
				Time:  rollup.Timestamp.AsTime(),
				Valid: true,
			},
			TxHash:     txHash,
			BlockStart: rollup.BlockStart,
			BlockEnd:   rollup.BlockEnd,
		},
	)
	if err != nil {
		return nil, err
	}

	if err = appDb.ClearUncommittedSlaNodeReports(ctx); err != nil {
		return nil, err
	}

	for _, r := range rollup.Reports {
		if err = appDb.CommitSlaNodeReport(
			ctx,
			db.CommitSlaNodeReportParams{
				Address:        r.Address,
				SlaRollupID:    pgtype.Int4{Int32: id, Valid: true},
				BlocksProposed: r.NumBlocksProposed,
			},
		); err != nil {
			return nil, err
		}
	}
	return rollup, nil
}
