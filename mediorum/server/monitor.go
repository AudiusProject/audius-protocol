package server

import (
	"context"
	"syscall"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/exp/slog"
)

func (ss *MediorumServer) monitorCidCursors() {
	ticker := time.NewTicker(10 * time.Second)
	for range ticker.C {
		cidCursors := []cidCursor{}
		ctx := context.Background()
		if err := pgxscan.Select(ctx, ss.pgPool, &cidCursors, `select * from cid_cursor order by host`); err == nil {
			ss.cachedCidCursors = cidCursors

			if ss.isSeedingLegacy && getPercentNodesSeededLegacy(cidCursors, ss.logger) > 50 {
				ss.isSeedingLegacy = false
				ss.logger.Info("seeding legacy complete")
			}
		}
	}
}

func (ss *MediorumServer) monitorDiskAndDbStatus() {
	ss.updateDiskAndDbStatus()
	ticker := time.NewTicker(2 * time.Minute)
	for range ticker.C {
		ss.updateDiskAndDbStatus()
	}
}

func (ss *MediorumServer) updateDiskAndDbStatus() {
	total, free, err := getDiskStatus(ss.Config.LegacyFSRoot)
	if err == nil {
		ss.storagePathUsed = total - free
		ss.storagePathSize = total
	} else {
		slog.Error("Error getting disk status", "err", err)
	}

	dbSize, err := getDatabaseSize(ss.pgPool)
	if err == nil {
		ss.databaseSize = dbSize
	} else {
		ss.databaseSize = 0
		slog.Error("Error getting database size", "err", err)
	}
}

func getDiskStatus(path string) (total uint64, free uint64, err error) {
	s := syscall.Statfs_t{}
	err = syscall.Statfs(path, &s)
	if err != nil {
		return
	}

	total = uint64(s.Bsize) * s.Blocks
	free = uint64(s.Bsize) * s.Bfree
	return
}

func getDatabaseSize(p *pgxpool.Pool) (uint64, error) {
	var size uint64
	err := p.QueryRow(context.Background(), `SELECT pg_database_size(current_database())`).Scan(&size)

	if err != nil {
		return 0, err
	}

	return size, nil
}

func getPercentNodesSeededLegacy(cidCursors []cidCursor, logger *slog.Logger) float64 {
	// we're still seeding from each node until its cursor is after 2023-06-01
	cutoff, err := time.Parse(time.RFC3339, "2023-06-01T00:00:00Z")
	if err != nil {
		logger.Error("error parsing seeding cutoff", "err", err)
		return 0
	}

	nCaughtUp := 0
	nPeers := len(cidCursors)
	for _, cursor := range cidCursors {
		if cursor.UpdatedAt.After(cutoff) {
			nCaughtUp++
		}
	}

	return (float64(nCaughtUp) / float64(nPeers)) * 100
}
