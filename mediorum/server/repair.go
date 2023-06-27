package server

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"golang.org/x/exp/slices"
	"gorm.io/gorm"
)

func (ss *MediorumServer) startRepairer() {

	// wait 10m after boot to start repair
	// we can add some jitter here to try to ensure nodes are spaced out
	time.Sleep(time.Minute * 10)

	for i := 1; ; i++ {
		// 10% percent of time... clean up over-replicated
		cleanupMode := false
		if i%10 == 0 {
			cleanupMode = true
		}

		logger := ss.logger.With("task", "repair", "run", i, "cleanupMode", cleanupMode)
		repairStart := time.Now()

		logger.Info("repair starting")
		err := ss.runRepair(cleanupMode)
		took := time.Since(repairStart)
		if err != nil {
			logger.Error("repair failed", "err", err, "took", took)
		} else {
			logger.Info("repair OK", "took", took)
		}

		// sleep for as long as the job took
		// if you wanted to aproximate max(1/5) of network running repair at same time...
		// you could make this node run repair ~1/5 of the time
		// (with some bounds)
		sleep := clampDuration(time.Minute*5, took*5, time.Hour*12)
		logger.Info("repair sleeping", "sleep", sleep)
		time.Sleep(sleep)

	}
}

type ProblemBlob struct {
	Key   string
	R     int
	Hosts string
}

func (ss *MediorumServer) findProblemBlobsBaseQuery(overReplicated bool) *gorm.DB {
	comparator := "<"
	if overReplicated {
		comparator = ">"
	}

	healthyHosts := ss.findHealthyPeers(5 * time.Minute)

	return ss.crud.DB.Model(&Blob{}).
		Select("key, count(distinct host) as r, array_to_string(array_agg(distinct host), ',') as hosts").
		Where("host in ?", healthyHosts).
		Group("key").
		Having(fmt.Sprintf("count(distinct host) %s %d", comparator, ss.Config.ReplicationFactor)).
		Order("random()")

}

func (ss *MediorumServer) findProblemBlobs(overReplicated bool) ([]ProblemBlob, error) {
	problems := []ProblemBlob{}
	err := ss.findProblemBlobsBaseQuery(overReplicated).
		Limit(1000). // repair 1000 problem blobs at a time
		Scan(&problems).
		Error
	return problems, err
}

func (ss *MediorumServer) findProblemBlobsCount(overReplicated bool) (int64, error) {
	var count int64 = 0
	err := ss.findProblemBlobsBaseQuery(overReplicated).
		Count(&count).
		Error
	return count, err
}

func (ss *MediorumServer) runRepair(cleanupMode bool) error {
	ctx := context.Background()

	logger := ss.logger.With("task", "repair", "cleanupMode", cleanupMode)

	// check that network is valid (should have more peers than replication factor)
	if healthyPeers := ss.findHealthyPeers(5 * time.Minute); len(healthyPeers) < ss.Config.ReplicationFactor {
		return fmt.Errorf("invalid network: not enough healthy peers for R%d: %v", ss.Config.ReplicationFactor, healthyPeers)
	}

	cidCursor := ""
	for {
		// scroll over all extant CIDs in batches
		// atm this uses `blobs` table for sake of repair_test.go
		// but if we drop blobs, this could also read out CIDs from the upload records
		var cidBatch []string
		err := pgxscan.Select(ctx, ss.pgPool, &cidBatch,
			`select distinct key
			 from blobs
			 where key > $1
			 order by key
			 limit 1000`, cidCursor)

		if err != nil {
			return err
		}
		if len(cidBatch) == 0 {
			break
		}

		for _, cid := range cidBatch {
			cidCursor = cid

			logger := logger.With("cid", cid)

			// don't try to repair legacy blob formats
			if !strings.HasPrefix(cid, "ba") {
				continue
			}

			preferredHosts, isMine := ss.rendezvous(cid)
			myRank := slices.Index(preferredHosts, ss.Config.Self.Host)

			// fast path if we're not in cleanup mode:
			// only worry about blobs that we _should_ have
			if !cleanupMode && !isMine {
				continue
			}

			isOnDisk, err := ss.bucket.Exists(ctx, cid)
			if err != nil {
				logger.Error("exist check failed", "err", err)
				continue
			}

			// in cleanup mode do some extra checks:
			// - validate CID, delete if invalid
			if cleanupMode && isOnDisk {
				if r, err := ss.bucket.NewReader(ctx, cid, nil); err == nil {
					err := validateCID(cid, r)
					r.Close()
					if err != nil {
						logger.Error("deleting invalid CID", "err", err)
						ss.bucket.Delete(ctx, cid)
						isOnDisk = false
					}
				}

			}

			// get blobs that I should have
			if isMine && !isOnDisk {
				success := false
				for _, host := range preferredHosts {
					if host == ss.Config.Self.Host {
						continue
					}
					err := ss.pullFileFromHost(host, cid)
					if err != nil {
						logger.Error("pull failed", "err", err, "host", host)
					} else {
						logger.Info("pull OK", "host", host)
						success = true
						break
					}
				}
				if !success {
					logger.Warn("failed to pull from any host", "hosts", preferredHosts)
				}
			}

			// delete over-replicated blobs:
			// check all the nodes ahead of me in the preferred order to ensure they have it
			// if R nodes in front of me have it, I can safely delete
			if cleanupMode && !isMine && isOnDisk {
				depth := 0
				for _, host := range preferredHosts {
					if ss.hostHasBlob(host, cid) {
						depth++
					}
					if host == ss.Config.Self.Host {
						break
					}
				}

				if depth > ss.Config.ReplicationFactor {
					logger.Info("deleting", "depth", depth, "hosts", preferredHosts)
					err = ss.dropFromMyBucket(cid)
					if err != nil {
						logger.Error("delete failed", "err", err)
					} else {
						logger.Info("delete OK")
					}
				}
			}

			// replicate under-replicated blobs:
			// even tho this blob isn't "mine"
			// in cleanup mode the top N*2 nodes will check to see if it's under-replicated
			// and pull file if under-replicated
			if cleanupMode && !isMine && !isOnDisk && myRank < ss.Config.ReplicationFactor*2 {
				hasIt := []string{}
				for _, host := range preferredHosts {
					if ss.hostHasBlob(host, cid, true) {
						if host == ss.Config.Self.Host {
							continue
						}
						hasIt = append(hasIt, host)
						if len(hasIt) == ss.Config.ReplicationFactor {
							break
						}
					}
				}

				if len(hasIt) < ss.Config.ReplicationFactor {
					// get it
					success := false
					for _, host := range hasIt {
						err := ss.pullFileFromHost(host, cid)
						if err != nil {
							logger.Error("pull failed", err, "host", host)
						} else {
							logger.Info("pull OK", "host", host)
							success = true
							break
						}
					}
					if !success {
						logger.Warn("failed to pull from any host", "hosts", preferredHosts)
					}
				}
			}
		}
	}

	return nil
}

func clampDuration(min time.Duration, val time.Duration, max time.Duration) time.Duration {
	if val < min {
		return min
	}
	if val > max {
		return max
	}
	return val
}
