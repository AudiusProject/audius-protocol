package server

import (
	"context"
	"errors"
	"syscall"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/exp/slog"
	"gorm.io/gorm"
)

func (ss *MediorumServer) monitorCidCursors() {
	ticker := time.NewTicker(10 * time.Second)
	for range ticker.C {
		cidCursors := []cidCursor{}
		ctx := context.Background()
		if err := pgxscan.Select(ctx, ss.pgPool, &cidCursors, `select * from cid_cursor order by host`); err == nil {
			ss.cachedCidCursors = cidCursors
		}
	}
}

func (ss *MediorumServer) monitorDiskAndDbStatus() {
	ss.updateDiskAndDbStatus()
	ticker := time.NewTicker(3 * time.Minute)
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

	dbSize, errStr := getDatabaseSize(ss.pgPool)
	ss.databaseSize = dbSize
	ss.dbSizeErr = errStr

	uploadsCount, errStr := getUploadsCount(ss.crud.DB)
	ss.uploadsCount = uploadsCount
	ss.uploadsCountErr = errStr
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

func getDatabaseSize(p *pgxpool.Pool) (size uint64, errStr string) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	if err := p.QueryRow(ctx, `SELECT pg_database_size(current_database())`).Scan(&size); err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			errStr = "timeout getting database size within 1s: " + err.Error()
		} else {
			errStr = "error getting database size: " + err.Error()
		}
	}

	return
}

func getUploadsCount(db *gorm.DB) (count int64, errStr string) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	if err := db.WithContext(ctx).Model(&Upload{}).Count(&count).Error; err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			errStr = "timeout getting uploads count within 60s: " + err.Error()
		} else {
			errStr = "error getting uploads count: " + err.Error()
		}
	}

	return
}
