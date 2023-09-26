package server

import (
	"context"
	"errors"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/exp/slices"
	"golang.org/x/exp/slog"
	"gorm.io/gorm"
)

type diskStatus struct {
	StoragePathSizeGB uint64    `json:"storagePathSizeGB"`
	StoragePathUsedGB uint64    `json:"storagePathUsedGB"`
	DatabaseSizeGB    uint64    `json:"databaseSizeGB"`
	Clock             time.Time `json:"clock"`
}

func (ss *MediorumServer) monitorDiskAndDbStatus() {
	// retry a few times to get initial status on startup
	for i := 0; i < 3; i++ {
		ss.updateDiskAndDbStatus()
		time.Sleep(time.Minute)
	}
	ticker := time.NewTicker(10 * time.Minute)
	for range ticker.C {
		ss.updateDiskAndDbStatus()
	}
}

func (ss *MediorumServer) monitorPeerReachability() {
	ticker := time.NewTicker(1 * time.Minute)
	for range ticker.C {
		// find unreachable nodes in the last 2 minutes
		var unreachablePeers []string
		for _, peer := range ss.Config.Peers {
			if peer.Host == ss.Config.Self.Host {
				continue
			}
			if peerHealth, ok := ss.peerHealths[peer.Host]; ok {
				if peerHealth.LastReachable.Before(time.Now().Add(-2 * time.Minute)) {
					unreachablePeers = append(unreachablePeers, peer.Host)
				}
			} else {
				unreachablePeers = append(unreachablePeers, peer.Host)
			}
		}

		// check if each unreachable node was also unreachable last time we checked (so we ignore temporary downtime from restarts/updates)
		for _, unreachable := range unreachablePeers {
			if slices.Contains(ss.unreachablePeers, unreachable) {
				// we can't reach this peer. self-mark unhealthy if >50% of other nodes can
				if ss.canMajorityReachHost(unreachable) {
					// TODO: self-mark unhealthy after nodes upgrade to expose reachable peers
					break
				}
			}
		}

		ss.peerHealthsMutex.Lock()
		ss.unreachablePeers = unreachablePeers
		ss.peerHealthsMutex.Unlock()
	}
}

func (ss *MediorumServer) canMajorityReachHost(host string) bool {
	ss.peerHealthsMutex.RLock()
	defer ss.peerHealthsMutex.RUnlock()

	twoMinAgo := time.Now().Add(-2 * time.Minute)
	numCanReach, numTotal := 0, 0
	for _, peer := range ss.peerHealths {
		if peer.LastReachable.After(twoMinAgo) {
			numTotal++
			if lastReachable, ok := peer.ReachablePeers[host]; ok && lastReachable.After(twoMinAgo) {
				numCanReach++
			}
		}
	}
	return numTotal < 5 || numCanReach > numTotal/2
}

func (ss *MediorumServer) updateDiskAndDbStatus() {
	dbSize, errStr := getDatabaseSize(ss.pgPool)
	ss.databaseSize = dbSize
	ss.dbSizeErr = errStr

	uploadsCount, errStr := getUploadsCount(ss.crud.DB)
	ss.uploadsCount = uploadsCount
	ss.uploadsCountErr = errStr

	// getDiskStatus returns the space occupied on the disk as a whole
	legacyTotal, legacyFree, err := getDiskStatus("/file_storage")
	if err == nil {
		ss.storagePathUsed = legacyTotal - legacyFree
		ss.storagePathSize = legacyTotal
	} else {
		slog.Error("Error getting legacy disk status", "err", err)
	}

	mediorumTotal, mediorumFree, err := getDiskStatus(ss.Config.Dir)
	if err == nil {
		ss.mediorumPathFree = mediorumFree
		ss.mediorumPathUsed = mediorumTotal - mediorumFree
		ss.mediorumPathSize = mediorumTotal
	} else {
		slog.Error("Error getting mediorum disk status", "err", err)
	}

	status := diskStatus{
		StoragePathSizeGB: ss.storagePathSize / (1 << 30),
		StoragePathUsedGB: ss.storagePathUsed / (1 << 30),
		DatabaseSizeGB:    ss.databaseSize / (1 << 30),
		Clock:             nearest5MinSinceEpoch(),
	}
	ss.logger.Info("updateDiskAndDbStatus", "diskStatus", status)
}

func nearest5MinSinceEpoch() time.Time {
	secondsSinceEpoch := time.Now().Unix()
	rounded := (secondsSinceEpoch + 150) / 300 * 300
	return time.Unix(rounded, 0)
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
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := p.QueryRow(ctx, `SELECT pg_database_size(current_database())`).Scan(&size); err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			errStr = "timeout getting database size within 10s: " + err.Error()
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
