package server

import (
	"context"
	"errors"
	"mediorum/cidutil"
	"net/http"
	"strconv"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/labstack/echo/v4"
	"gocloud.dev/blob"
	"gocloud.dev/gcerrors"
	"golang.org/x/exp/slices"
	"gorm.io/gorm"
)

type RepairTracker struct {
	StartedAt      time.Time `gorm:"primaryKey;not null"`
	UpdatedAt      time.Time `gorm:"not null"`
	FinishedAt     time.Time
	CleanupMode    bool           `gorm:"not null"`
	CursorI        int            `gorm:"not null"`
	CursorUploadID string         `gorm:"not null"`
	CursorQmCID    string         `gorm:"not null"`
	Counters       map[string]int `gorm:"not null;serializer:json"`
	ContentSize    int64          `gorm:"not null"`
	Duration       time.Duration  `gorm:"not null"`
	AbortedReason  string         `gorm:"not null"`
}

func (ss *MediorumServer) startRepairer() {
	// wait a minute on startup to determine healthy peers
	time.Sleep(time.Minute * 1)

	logger := ss.logger.With("task", "repair")

	for {
		// pick up where we left off from the last repair.go run, including if the server restarted in the middle of a run
		tracker := RepairTracker{
			StartedAt:   time.Now(),
			CleanupMode: true,
			CursorI:     1,
			Counters:    map[string]int{},
		}
		var lastRun RepairTracker
		if err := ss.crud.DB.Order("started_at desc").First(&lastRun).Error; err == nil {
			if lastRun.FinishedAt.IsZero() {
				// resume previously interrupted job
				tracker = lastRun
			} else {
				// run the next job
				tracker.CursorI = lastRun.CursorI + 1

				// 10% percent of time... clean up over-replicated and pull under-replicated
				if tracker.CursorI >= 10 {
					tracker.CursorI = 1
				}
				tracker.CleanupMode = tracker.CursorI == 1
			}
		} else {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				logger.Error("failed to get last repair.go run", "err", err)
			}
		}
		logger := logger.With("run", tracker.CursorI, "cleanupMode", tracker.CleanupMode)

		saveTracker := func() {
			tracker.UpdatedAt = time.Now()
			if err := ss.crud.DB.Save(tracker).Error; err != nil {
				logger.Error("failed to save repair tracker", "err", err)
			}
		}

		// check that network is valid (should have more peers than replication factor)
		if healthyPeers := ss.findHealthyPeers(time.Hour); len(healthyPeers) < ss.Config.ReplicationFactor {
			logger.Warn("not enough healthy peers to run repair",
				"R", ss.Config.ReplicationFactor,
				"peers", len(healthyPeers))
			tracker.AbortedReason = "NOT_ENOUGH_PEERS"
			tracker.FinishedAt = time.Now()
			saveTracker()
			// wait 1 minute before running again
			time.Sleep(time.Minute * 1)
			continue
		}

		// check that disk has space
		if !ss.diskHasSpace() && !tracker.CleanupMode {
			logger.Warn("disk has <200GB remaining and is not in cleanup mode. skipping repair")
			tracker.AbortedReason = "DISK_FULL"
			tracker.FinishedAt = time.Now()
			saveTracker()
			// wait 1 minute before running again
			time.Sleep(time.Minute * 1)
			continue
		}

		logger.Info("repair starting")
		err := ss.runRepair(&tracker)
		tracker.FinishedAt = time.Now()
		if err != nil {
			logger.Error("repair failed", "err", err, "took", tracker.Duration)
			tracker.AbortedReason = err.Error()
		} else {
			logger.Info("repair OK", "took", tracker.Duration)
			ss.lastSuccessfulRepair = tracker
			if tracker.CleanupMode {
				ss.lastSuccessfulCleanup = tracker
			}
		}
		saveTracker()

		// wait 10 minutes before running again
		time.Sleep(time.Minute * 10)
	}
}

func (ss *MediorumServer) runRepair(tracker *RepairTracker) error {
	ctx := context.Background()

	saveTracker := func() {
		tracker.UpdatedAt = time.Now()
		if err := ss.crud.DB.Save(tracker).Error; err != nil {
			ss.logger.Error("failed to save tracker", "err", err)
		}
	}

	// scroll uploads and repair CIDs
	// (later this can clean up "derivative" images if we make image resizing dynamic)
	for {
		// abort if disk is filling up
		if !ss.diskHasSpace() && !tracker.CleanupMode {
			tracker.AbortedReason = "DISK_FULL"
			saveTracker()
			break
		}

		startIter := time.Now()

		var uploads []Upload
		if err := ss.crud.DB.Where("id > ?", tracker.CursorUploadID).Order("id").Limit(1000).Find(&uploads).Error; err != nil {
			return err
		}
		if len(uploads) == 0 {
			break
		}
		for _, u := range uploads {
			tracker.CursorUploadID = u.ID
			ss.repairCid(u.OrigFileCID, tracker)
			// images are resized dynamically
			// so only consider audio TranscodeResults for repair
			if u.Template != JobTemplateAudio {
				continue
			}
			for _, cid := range u.TranscodeResults {
				ss.repairCid(cid, tracker)
			}
		}

		tracker.Duration += time.Since(startIter)
		saveTracker()
	}

	// scroll older qm_cids table and repair
	for {
		// abort if disk is filling up
		if !ss.diskHasSpace() && !tracker.CleanupMode {
			tracker.AbortedReason = "DISK_FULL"
			saveTracker()
			break
		}

		startIter := time.Now()

		var cidBatch []string
		err := pgxscan.Select(ctx, ss.pgPool, &cidBatch,
			`select key
			 from qm_cids
			 where key > $1
			 order by key
			 limit 1000`, tracker.CursorQmCID)

		if err != nil {
			return err
		}
		if len(cidBatch) == 0 {
			break
		}
		for _, cid := range cidBatch {
			tracker.CursorQmCID = cid
			ss.repairCid(cid, tracker)
		}

		tracker.Duration += time.Since(startIter)
		saveTracker()
	}

	return nil
}

func (ss *MediorumServer) repairCid(cid string, tracker *RepairTracker) error {
	ctx := context.Background()
	logger := ss.logger.With("task", "repair", "cid", cid, "cleanup", tracker.CleanupMode)

	preferredHosts, isMine := ss.rendezvousAllHosts(cid)
	preferredHealthyHosts, isMineHealthy := ss.rendezvousHealthyHosts(cid)

	// fast path: do zero bucket ops if we know we don't care about this cid
	if !tracker.CleanupMode && !isMineHealthy {
		return nil
	}

	tracker.Counters["total_checked"]++

	// use preferredHealthyHosts when determining my rank because we want to check if we're in the top N*2 healthy nodes not the top N*2 unhealthy nodes
	myRank := slices.Index(preferredHealthyHosts, ss.Config.Self.Host)

	key := cidutil.ShardCID(cid)
	alreadyHave := true
	attrs := &blob.Attributes{}
	attrs, err := ss.bucket.Attributes(ctx, key)
	if err != nil {
		if gcerrors.Code(err) == gcerrors.NotFound {
			attrs = &blob.Attributes{}
			alreadyHave = false
		} else {
			tracker.Counters["read_attrs_fail"]++
			logger.Error("exist check failed", "err", err)
			return err
		}
	}

	// in cleanup mode do some extra checks:
	// - validate CID, delete if invalid (doesn't apply to Qm keys because their hash is not the CID)
	if tracker.CleanupMode && alreadyHave && !cidutil.IsLegacyCID(cid) {
		if r, errRead := ss.bucket.NewReader(ctx, key, nil); errRead == nil {
			errVal := cidutil.ValidateCID(cid, r)
			errClose := r.Close()
			if err != nil {
				tracker.Counters["delete_invalid_needed"]++
				logger.Error("deleting invalid CID", "err", errVal)
				if errDel := ss.bucket.Delete(ctx, key); errDel == nil {
					tracker.Counters["delete_invalid_success"]++
				} else {
					tracker.Counters["delete_invalid_fail"]++
					logger.Error("failed to delete invalid CID", "err", errDel)
				}
				return err
			}

			if errClose != nil {
				logger.Error("failed to close blob reader", "err", errClose)
			}
		} else {
			tracker.Counters["read_blob_fail"]++
			logger.Error("failed to read blob", "err", errRead)
			return errRead
		}
	}

	if alreadyHave {
		tracker.Counters["already_have"]++
		tracker.ContentSize += attrs.Size
	}

	// get blobs that I should have (regardless of health of other nodes)
	if isMine && !alreadyHave && ss.diskHasSpace() {
		tracker.Counters["pull_mine_needed"]++
		success := false
		// loop preferredHosts (not preferredHealthyHosts) because pullFileFromHost can still give us a file even if we thought the host was unhealthy
		for _, host := range preferredHosts {
			if host == ss.Config.Self.Host {
				continue
			}
			err := ss.pullFileFromHost(host, cid)
			if err != nil {
				tracker.Counters["pull_mine_fail"]++
				logger.Error("pull failed (blob I should have)", "err", err, "host", host)
			} else {
				tracker.Counters["pull_mine_success"]++
				logger.Info("pull OK (blob I should have)", "host", host)
				success = true

				pulledAttrs, errAttrs := ss.bucket.Attributes(ctx, key)
				if errAttrs != nil {
					tracker.ContentSize += pulledAttrs.Size
				}
				return nil
			}
		}
		if !success {
			logger.Warn("failed to pull from any host", "hosts", preferredHosts)
			return errors.New("failed to pull from any host")
		}
	}

	// delete over-replicated blobs:
	// check all healthy nodes ahead of me in the preferred order to ensure they have it.
	// if R+1 healthy nodes in front of me have it, I can safely delete.
	// don't delete if we replicated the blob within the past 24 hours
	// wasReplicatedToday := attrs.CreateTime.After(time.Now().Add(-24 * time.Hour))
	wasReplicatedThisWeek := attrs.CreateTime.After(time.Now().Add(-24 * 7 * time.Hour))

	if !ss.Config.StoreAll && tracker.CleanupMode && alreadyHave && myRank > ss.Config.ReplicationFactor*3 && !wasReplicatedThisWeek {
		// depth := 0
		// // loop preferredHealthyHosts (not preferredHosts) because we don't mind storing a blob a little while longer if it's not on enough healthy nodes
		// for _, host := range preferredHealthyHosts {
		// 	if ss.hostHasBlob(host, cid) {
		// 		depth++
		// 	}
		// 	if host == ss.Config.Self.Host {
		// 		break
		// 	}
		// }

		// if i'm the first node that over-replicated, keep the file for a week as a buffer since a node ahead of me in the preferred order will likely be down temporarily at some point
		tracker.Counters["delete_over_replicated_needed"]++
		err = ss.dropFromMyBucket(cid)
		if err != nil {
			tracker.Counters["delete_over_replicated_fail"]++
			logger.Error("delete failed", "err", err)
			return err
		} else {
			tracker.Counters["delete_over_replicated_success"]++
			logger.Info("delete OK")
			tracker.ContentSize -= attrs.Size
			return nil
		}
	}

	// replicate under-replicated blobs:
	// even tho this blob isn't "mine"
	// in cleanup mode the top N*2 healthy nodes will check to see if it's under-replicated
	// and pull file if under-replicated
	// if tracker.CleanupMode && !isMine && !alreadyHave && myRank >= 0 && myRank < ss.Config.ReplicationFactor*2 && ss.diskHasSpace() {
	// 	hasIt := []string{}
	// 	// loop preferredHosts (not preferredHealthyHosts) because hostHasBlob is the real source of truth for if a node can serve a blob (not our health info about the host, which could be outdated)
	// 	for _, host := range preferredHosts {
	// 		if ss.hostHasBlob(host, cid) {
	// 			if host == ss.Config.Self.Host {
	// 				continue
	// 			}
	// 			hasIt = append(hasIt, host)
	// 			if len(hasIt) == ss.Config.ReplicationFactor {
	// 				break
	// 			}
	// 		}
	// 	}

	// 	if len(hasIt) < ss.Config.ReplicationFactor {
	// 		// get it
	// 		tracker.Counters["pull_under_replicated_needed"]++
	// 		success := false
	// 		for _, host := range hasIt {
	// 			err := ss.pullFileFromHost(host, cid)
	// 			if err != nil {
	// 				tracker.Counters["pull_under_replicated_fail"]++
	// 				logger.Error("pull failed (under-replicated)", err, "host", host)
	// 			} else {
	// 				tracker.Counters["pull_under_replicated_success"]++
	// 				logger.Info("pull OK (under-replicated)", "host", host)

	// 				pulledAttrs, errAttrs := ss.bucket.Attributes(ctx, key)
	// 				if errAttrs != nil {
	// 					tracker.ContentSize += pulledAttrs.Size
	// 				}
	// 				return nil
	// 			}
	// 		}
	// 		if !success {
	// 			logger.Warn("failed to pull under-replicated from any host", "hosts", preferredHosts)
	// 			return errors.New("failed to pull under-replicated from any host")
	// 		}
	// 	}
	// }

	return nil
}

func (ss *MediorumServer) serveRepairLog(c echo.Context) error {
	limitStr := c.QueryParam("limit")
	if limitStr == "" {
		limitStr = "1000"
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		return c.String(http.StatusBadRequest, "Invalid limit value")
	}

	if limit > 1000 {
		limit = 1000
	}

	var logs []RepairTracker
	if err := ss.crud.DB.Order("started_at desc").Limit(limit).Find(&logs).Error; err != nil {
		return c.String(http.StatusInternalServerError, "DB query failed")
	}

	return c.JSON(http.StatusOK, logs)
}
