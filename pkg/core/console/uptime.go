package console

import (
	"strconv"

	"github.com/AudiusProject/audius-protocol/pkg/core/console/views/pages"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

func (cs *Console) uptimeFragment(c echo.Context) error {
	ctx := c.Request().Context()
	rollupId := c.Param("rollup")

	var rollup db.SlaRollup
	var quota = 0
	var avgBlockTimeMs = 0
	var recentRollups []db.GetRecentRollupsForNodeRow
	var reports []db.SlaNodeReport
	var myReport db.SlaNodeReport
	var validators []db.CoreValidator
	var validatorMap map[string]db.CoreValidator
	var err error
	var i int
	if rollupId == "" || rollupId == "latest" {
		rollup, err = cs.db.GetLatestSlaRollup(ctx)
	} else if i, err = strconv.Atoi(rollupId); err == nil {
		rollup, err = cs.db.GetSlaRollupWithId(ctx, int32(i))
	} else {
		cs.logger.Error("Sla page called with invalid rollup id")
		return err
	}
	if err != nil && err != pgx.ErrNoRows {
		cs.logger.Error("Failed to retrieve SlaRollup from db", "error", err)
		return err
	}
	reports, err = cs.db.GetRollupReportsForId(ctx, pgtype.Int4{Int32: rollup.ID, Valid: true})
	if err != nil && err != pgx.ErrNoRows {
		cs.logger.Error("Failed to fetch reports for latest SlaRollup from db", "error", err)
		return err
	}

	// OK if myReport is empty
	myReport, err = cs.db.GetRollupReportForNodeAndId(
		ctx,
		db.GetRollupReportForNodeAndIdParams{
			Address:     cs.state.cometAddress,
			SlaRollupID: pgtype.Int4{Int32: rollup.ID, Valid: true},
		},
	)
	if err != nil && err != pgx.ErrNoRows {
		cs.logger.Error("Error while fetching this node's report for latest SlaRollup from db", "error", err)
		return err
	}

	recentRollups, err = cs.db.GetRecentRollupsForNode(ctx, cs.state.cometAddress)
	if err != nil && err != pgx.ErrNoRows {
		cs.logger.Error("Failed to get recent rollups from db", "error", err)
		return err
	}

	previousRollup, err := cs.db.GetPreviousSlaRollupFromId(ctx, rollup.ID)
	if err != nil && err != pgx.ErrNoRows {
		cs.logger.Error("Failure reading previous SlaRollup from db", "error", err)
		return err
	} else if err == nil && rollup.BlockEnd != 0 {
		totalBlocks := int(rollup.BlockEnd - rollup.BlockStart)
		avgBlockTimeMs = int(rollup.Time.Time.UnixMilli()-previousRollup.Time.Time.UnixMilli()) / totalBlocks
	}

	validators, err = cs.db.GetAllRegisteredNodes(ctx)
	if err != nil && err != pgx.ErrNoRows {
		cs.logger.Error("Failed to get registered nodes from db", "error", err)
		return err
	}
	validatorMap = make(map[string]db.CoreValidator, len(validators))
	for _, v := range validators {
		validatorMap[v.CometAddress] = v
	}
	_, isValidator := validatorMap[cs.state.cometAddress]
	if len(validators) > 0 {
		quota = int(rollup.BlockEnd-rollup.BlockStart) / len(validators)
	}

	return cs.views.RenderUptimeView(c, &pages.UptimePageView{
		Rollup:         rollup,
		Quota:          quota,
		Address:        cs.state.cometAddress,
		MyReport:       myReport,
		AllNodeReports: reports,
		RecentRollups:  recentRollups,
		ValidatorMap:   validatorMap,
		AvgBlockTimeMs: avgBlockTimeMs,
		NodeExempt:     !isValidator,
	})
}
