package server

import (
	"context"
	"fmt"
	"math/rand"
	"mediorum/cidutil"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"gocloud.dev/blob"
	"gocloud.dev/gcerrors"
	"golang.org/x/exp/slices"
)

func (ss *MediorumServer) startRepairer() {

	// wait 10m after boot to start repair (plus up to 10 more minutes to space out nodes)
	time.Sleep(time.Minute*10 + time.Minute*time.Duration(rand.Intn(10)))

	for i := 1; ; i++ {
		replicateMode := ss.shouldReplicate()
		// 10% percent of time... clean up over-replicated and pull under-replicated
		cleanupMode := false
		if i%10 == 0 {
			cleanupMode = true
		}

		logger := ss.logger.With("task", "repair", "run", i, "cleanupMode", cleanupMode)
		took := time.Duration(0)
		if replicateMode || cleanupMode {
			repairStart := time.Now()
			logger.Info("repair starting")
			err := ss.runRepair(replicateMode, cleanupMode)
			took = time.Since(repairStart)
			if err != nil {
				logger.Error("repair failed", "err", err, "took", took)
			} else {
				logger.Info("repair OK", "took", took)
			}
			if cleanupMode {
				ss.lastRepairCleanupComplete = time.Now()
				ss.lastRepairCleanupDuration = took
			}
		} else {
			logger.Warn("disk has <200GB remaining and is not in cleanup mode. skipping repair")
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

func (ss *MediorumServer) runRepair(replicateMode, cleanupMode bool) error {
	ctx := context.Background()

	logger := ss.logger.With("task", "repair", "replicateMode", replicateMode, "cleanupMode", cleanupMode)

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

			preferredHosts, isMine := ss.rendezvousAllHosts(cid)
			preferredHealthyHosts, isMineHealthy := ss.rendezvousHealthyHosts(cid)

			// use preferredHealthyHosts when determining my rank because we want to check if we're in the top N*2 healthy nodes not the top N*2 unhealthy nodes
			myRank := slices.Index(preferredHealthyHosts, ss.Config.Self.Host)

			// fast path if we're not in cleanup mode:
			// only worry about blobs that we _should_ have
			if !cleanupMode && !isMine && !isMineHealthy {
				continue
			}

			key := cidutil.ShardCID(cid)
			var alreadyHave bool
			attrs, err := ss.bucket.Attributes(ctx, key)
			if err == nil {
				alreadyHave = true
				ss.radixSetHostHasCID(ss.Config.Self.Host, cid)
			} else if gcerrors.Code(err) == gcerrors.NotFound {
				ss.radixSetHostNotHasCID(ss.Config.Self.Host, cid)
				alreadyHave = false
				attrs = &blob.Attributes{}
			} else {
				logger.Error("exist check failed", "err", err)
				continue
			}

			// in cleanup mode do some extra checks:
			// - validate CID, delete if invalid (doesn't apply to Qm keys because their hash is not the CID)
			if cleanupMode && alreadyHave && !cidutil.IsLegacyCID(cid) {
				if r, err := ss.bucket.NewReader(ctx, key, nil); err == nil {
					err := cidutil.ValidateCID(cid, r)
					r.Close()
					if err != nil {
						logger.Error("deleting invalid CID", "err", err)
						ss.bucket.Delete(ctx, key)
						alreadyHave = false
					}
				}
			}

			// get blobs that I should have (regardless of health of other nodes)
			if replicateMode && isMine && !alreadyHave {
				success := false
				// loop preferredHosts (not preferredHealthyHosts) because pullFileFromHost can still give us a file even if we thought the host was unhealthy
				for _, host := range preferredHosts {
					if host == ss.Config.Self.Host {
						continue
					}
					err := ss.pullFileFromHost(host, cid)
					if err != nil {
						logger.Error("pull failed (blob I should have)", "err", err, "host", host)
						ss.radixSetHostNotHasCID(host, cid)
					} else {
						logger.Info("pull OK (blob I should have)", "host", host)
						success = true
						break
					}
				}
				if success {
					ss.radixSetHostHasCID(ss.Config.Self.Host, cid)
				} else {
					logger.Warn("failed to pull from any host", "hosts", preferredHosts)
					ss.radixSetHostNotHasCID(ss.Config.Self.Host, cid)
				}
			}

			// delete over-replicated blobs:
			// check all healthy nodes ahead of me in the preferred order to ensure they have it.
			// if R+1 healthy nodes in front of me have it, I can safely delete.
			// don't delete if we replicated the blob within the past 24 hours
			wasReplicatedToday := attrs.CreateTime.After(time.Now().Add(-24 * time.Hour))
			if cleanupMode && (!isMine || !isMineHealthy) && alreadyHave && !wasReplicatedToday {
				depth := 0
				// loop preferredHealthyHosts (not preferredHosts) because we don't mind storing a blob a little while longer if it's not on enough healthy nodes
				for _, host := range preferredHealthyHosts {
					if ss.hostHasBlob(host, cid) {
						ss.radixSetHostHasCID(host, cid)
						depth++
					}
					if host == ss.Config.Self.Host {
						break
					}
				}

				// if i'm the first node that over-replicated, keep the file for a week as a buffer since a node ahead of me in the preferred order will likely be down temporarily at some point
				wasReplicatedThisWeek := attrs.CreateTime.After(time.Now().Add(-24 * 7 * time.Hour))
				if depth > ss.Config.ReplicationFactor+1 || depth == ss.Config.ReplicationFactor+1 && !wasReplicatedThisWeek {
					logger.Info("deleting", "depth", depth, "hosts", preferredHosts, "healthyHosts", preferredHealthyHosts)
					err = ss.dropFromMyBucket(cid)
					if err != nil {
						logger.Error("delete failed", "err", err)
					} else {
						logger.Info("delete OK")
						ss.radixSetHostNotHasCID(ss.Config.Self.Host, cid)
					}
				}
			}

			// replicate under-replicated blobs:
			// even tho this blob isn't "mine"
			// in cleanup mode the top N*2 healthy nodes will check to see if it's under-replicated
			// and pull file if under-replicated
			if replicateMode && cleanupMode && !isMine && !alreadyHave && myRank >= 0 && myRank < ss.Config.ReplicationFactor*2 {
				hasIt := []string{}
				// loop preferredHosts (not preferredHealthyHosts) because hostHasBlob is the real source of truth for if a node can serve a blob (not our health info about the host, which could be outdated)
				for _, host := range preferredHosts {
					if ss.hostHasBlob(host, cid) {
						ss.radixSetHostHasCID(host, cid)
						if host == ss.Config.Self.Host {
							continue
						}
						hasIt = append(hasIt, host)
						if len(hasIt) == ss.Config.ReplicationFactor {
							break
						}
					} else {
						ss.radixSetHostNotHasCID(host, cid)
					}
				}

				if len(hasIt) < ss.Config.ReplicationFactor {
					// get it
					success := false
					for _, host := range hasIt {
						err := ss.pullFileFromHost(host, cid)
						if err != nil {
							logger.Error("pull failed (under-replicated)", err, "host", host)
						} else {
							logger.Info("pull OK (under-replicated)", "host", host)
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
