package console

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strconv"

	"github.com/AudiusProject/audius-protocol/pkg/core/console/views/pages"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

const validatorReportHistoryLength = 5

func (cs *Console) uptimeFragment(c echo.Context) error {
	ctx := c.Request().Context()
	rollupId := c.Param("rollup")

	// Get active report
	activeReport, err := cs.getActiveProofOfWorkReport(ctx, rollupId)
	if err != nil {
		cs.logger.Error("Falled to get active Proof Of Work report", "error", err)
		return err
	}

	// Attach report to this node
	myUptime := pages.NodeUptime{
		Address:       cs.state.cometAddress,
		ActiveReport:  activeReport,
		ReportHistory: make([]pages.ProofOfWorkReport, 0, 30),
	}

	// Get avg block time
	avgBlockTimeMs, err := cs.getAverageBlockTimeForReport(ctx, activeReport)
	if err != nil {
		cs.logger.Error("Failed to calculate average block time", "error", err)
		return err
	}

	// Gather validator info
	validators, err := cs.db.GetAllRegisteredNodes(ctx)
	if err != nil && err != pgx.ErrNoRows {
		cs.logger.Error("Failed to get registered nodes from db", "error", err)
		return err
	}
	validatorMap := make(map[string]*pages.NodeUptime, len(validators))
	for _, v := range validators {
		validatorMap[v.CometAddress] = &pages.NodeUptime{
			Endpoint:      v.Endpoint,
			Address:       v.CometAddress,
			IsValidator:   true,
			ReportHistory: make([]pages.ProofOfWorkReport, 0, validatorReportHistoryLength),
		}
	}
	_, isValidator := validatorMap[cs.state.cometAddress]
	myUptime.IsValidator = isValidator

	// Get history for this node
	recentRollups, err := cs.db.GetRecentRollupsForNode(ctx, cs.state.cometAddress)
	if err != nil && err != pgx.ErrNoRows {
		cs.logger.Error("Failed to get recent rollups from db", "error", err)
		return err
	}
	for _, rr := range recentRollups {
		reportQuota := int32(0)
		if len(validators) > 0 {
			reportQuota = int32(rr.BlockEnd-rr.BlockStart) / int32(len(validators))
		}
		myUptime.ReportHistory = append(
			myUptime.ReportHistory,
			pages.ProofOfWorkReport{
				SlaRollupId:    rr.ID,
				TxHash:         rr.TxHash,
				BlockStart:     rr.BlockStart,
				BlockEnd:       rr.BlockEnd,
				BlocksProposed: rr.BlocksProposed.Int32,
				Quota:          reportQuota,
				Time:           rr.Time.Time,
			},
		)
	}

	// Get history for all validators
	bulkRecentReports, err := cs.db.GetRecentRollupsForAllNodes(
		ctx,
		db.GetRecentRollupsForAllNodesParams{
			ID:    activeReport.SlaRollupId,
			Limit: int32(validatorReportHistoryLength),
		},
	)
	if err != nil && err != pgx.ErrNoRows {
		cs.logger.Error("Failure getting bulk recent reports", "error", err)
		return err
	}
	for _, rr := range bulkRecentReports {
		if valData, ok := validatorMap[rr.Address.String]; ok {
			var reportQuota int32 = 0
			if len(validatorMap) > 0 {
				reportQuota = int32(rr.BlockEnd-rr.BlockStart) / int32(len(validators))
			}
			rep := pages.ProofOfWorkReport{
				SlaRollupId:    rr.ID,
				TxHash:         rr.TxHash,
				BlockStart:     rr.BlockStart,
				BlockEnd:       rr.BlockEnd,
				BlocksProposed: rr.BlocksProposed.Int32,
				Quota:          reportQuota,
				Time:           rr.Time.Time,
			}
			if rr.ID == myUptime.ActiveReport.SlaRollupId {
				valData.ActiveReport = rep
			}
			valData.ReportHistory = append(valData.ReportHistory, rep)
		}
	}

	// Store validators as sorted slice
	// (adjust sorting method to fit display preference)
	sortedValidators := make([]*pages.NodeUptime, 0, len(validatorMap))
	for _, v := range validatorMap {
		sortedValidators = append(sortedValidators, v)
	}
	sort.Slice(sortedValidators, func(i, j int) bool {
		return sortedValidators[i].Address < sortedValidators[j].Address
	})

	return cs.views.RenderUptimeView(c, &pages.UptimePageView{
		ActiveNodeUptime: myUptime,
		ValidatorUptimes: sortedValidators,
		AvgBlockTimeMs:   avgBlockTimeMs,
	})
}

func (cs *Console) getActiveProofOfWorkReport(ctx context.Context, rollupId string) (pages.ProofOfWorkReport, error) {
	var report pages.ProofOfWorkReport

	var rollup db.SlaRollup
	var err error
	if rollupId == "" || rollupId == "latest" {
		rollup, err = cs.db.GetLatestSlaRollup(ctx)
	} else if i, err := strconv.Atoi(rollupId); err == nil {
		rollup, err = cs.db.GetSlaRollupWithId(ctx, int32(i))
	} else {
		err = fmt.Errorf("Sla page called with invalid rollup id %s", rollupId)
	}
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		err = fmt.Errorf("Failed to retrieve SlaRollup from db: %v", err)
		return report, err
	}

	mySlaNodeReport, err := cs.db.GetRollupReportForNodeAndId(
		ctx,
		db.GetRollupReportForNodeAndIdParams{
			Address:     cs.state.cometAddress,
			SlaRollupID: pgtype.Int4{Int32: rollup.ID, Valid: true},
		},
	)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		err = fmt.Errorf("Error while fetching this node's report for latest SlaRollup from db: %v", err)
		return report, err
	}

	var quota int32 = 0
	var numValidators int64 = 0
	numValidators, err = cs.db.TotalValidators(ctx)
	if err != nil {
		err = fmt.Errorf("Could not get total validators from db: %v", err)
		return report, err
	}
	if numValidators > int64(0) {
		quota = int32(rollup.BlockEnd-rollup.BlockStart) / int32(numValidators)
	}
	report = pages.ProofOfWorkReport{
		SlaRollupId:    rollup.ID,
		TxHash:         rollup.TxHash,
		BlockStart:     rollup.BlockStart,
		BlockEnd:       rollup.BlockEnd,
		BlocksProposed: mySlaNodeReport.BlocksProposed,
		Quota:          quota,
		Time:           rollup.Time.Time,
	}

	return report, nil
}

func (cs *Console) getAverageBlockTimeForReport(ctx context.Context, report pages.ProofOfWorkReport) (int, error) {
	var avgBlockTimeMs int = 0
	previousRollup, err := cs.db.GetPreviousSlaRollupFromId(ctx, report.SlaRollupId)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		err = fmt.Errorf("Failure reading previous SlaRollup from db: %v", err)
	} else if errors.Is(err, pgx.ErrNoRows) {
		err = nil
	} else if err == nil && report.BlockEnd != 0 {
		totalBlocks := int(report.BlockEnd - report.BlockStart)
		avgBlockTimeMs = int(report.Time.UnixMilli()-previousRollup.Time.Time.UnixMilli()) / totalBlocks
	}
	return avgBlockTimeMs, err
}
