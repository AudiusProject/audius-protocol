package server

import (
	"context"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/exp/slog"
)

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
		slog.Error("Error getting disk status", err)
	}

	dbSize, err := getDatabaseSize(ss.pgPool)
	if err == nil {
		ss.databaseSize = dbSize
	} else {
		slog.Error("Error getting database size", err)
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
