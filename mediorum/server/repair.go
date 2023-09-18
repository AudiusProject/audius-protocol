package server

import (
	"context"
	"errors"
	"math/rand"
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
	StartedAt         time.Time     `json:"started_at" gorm:"primaryKey;not null"`
	CleanupMode       bool          `json:"cleanup_mode" gorm:"not null"`
	CursorI           int           `json:"cursor_i" gorm:"not null"`
	CursorUploadID    string        `json:"cursor_upload_id" gorm:"not null"`
	CursorQmCID       string        `json:"cursor_qm_cid" gorm:"not null"`
	NumCIDsChecked    int           `json:"num_cids_checked" gorm:"not null"`
	NumCIDsReplicated int           `json:"num_cids_replicated" gorm:"not null"`
	NumCIDsDeleted    int           `json:"num_cids_deleted" gorm:"not null"`
	Duration          time.Duration `json:"duration" gorm:"not null"`
	Complete          bool          `json:"complete" gorm:"not null"`
	ContentSize       int64         `json:"content_size" gorm:"not null"`
	AbortedReason     string        `json:"aborted_reason" gorm:"not null"`
}

func (ss *MediorumServer) startRepairer() {
	logger := ss.logger.With("task", "repair")

	for {
		// wait between 10 and 30 minutes between repair runs
		time.Sleep(time.Minute*10 + time.Minute*time.Duration(rand.Intn(20)))

		// pick up where we left off from the last repair.go run, including if the server restarted in the middle of a run
		tracker := RepairTracker{}
		var lastRun RepairTracker
		if err := ss.crud.DB.Order("started_at desc").First(&lastRun).Error; err == nil {
			if lastRun.Complete || lastRun.AbortedReason != "" {
				// if the last job was completed or aborted, run the next job
				tracker.StartedAt = time.Now()
				tracker.CursorI = lastRun.CursorI + 1

				// 10% percent of time... clean up over-replicated and pull under-replicated
				if tracker.CursorI >= 10 {
					tracker.CursorI = 1
				}
				tracker.CleanupMode = tracker.CursorI == 1
			} else {
				// resume previously interrupted job
				tracker = lastRun
			}
		} else {
			// couldn't find a last, run so start from scratch
			tracker = RepairTracker{
				StartedAt:   time.Now(),
				CleanupMode: true,
				CursorI:     1,
			}

			if !errors.Is(err, gorm.ErrRecordNotFound) {
				logger.Error("failed to get last repair.go run", "err", err)
			}
		}
		logger := logger.With("run", tracker.CursorI, "cleanupMode", tracker.CleanupMode)

		saveTracker := func() {
			if err := ss.crud.DB.Save(tracker).Error; err != nil {
				logger.Error("failed to save repair tracker", "err", err)
			}
		}

		// check that network is valid (should have more peers than replication factor)
		if healthyPeers := ss.findHealthyPeers(5 * time.Minute); len(healthyPeers) < ss.Config.ReplicationFactor {
			logger.Warn("not enough healthy peers to run repair",
				"R", ss.Config.ReplicationFactor,
				"peers", len(healthyPeers))
			tracker.AbortedReason = "NOT_ENOUGH_PEERS"
			saveTracker()
			continue
		}

		// check that disk has space
		if !ss.diskHasSpace() && !tracker.CleanupMode {
			logger.Warn("disk has <200GB remaining and is not in cleanup mode. skipping repair")
			tracker.AbortedReason = "DISK_FULL"
			saveTracker()
			continue
		}

		logger.Info("repair starting")
		err := ss.runRepair(&tracker)
		if err != nil {
			logger.Error("repair failed", "err", err, "took", tracker.Duration)
			tracker.AbortedReason = err.Error()
			saveTracker()
		} else {
			logger.Info("repair OK", "took", tracker.Duration)
		}
	}
}

func (ss *MediorumServer) runRepair(tracker *RepairTracker) error {
	ctx := context.Background()
	var expectedContentSize int64

	saveTracker := func() {
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
		if err := ss.crud.DB.Where("id > ?", tracker.CursorUploadID).Order("id").Limit(5000).Find(&uploads).Error; err != nil {
			return err
		}
		if len(uploads) == 0 {
			break
		}
		for _, u := range uploads {
			tracker.CursorUploadID = u.ID
			ss.repairCid(u.OrigFileCID, tracker.CleanupMode, &expectedContentSize)
			for _, cid := range u.TranscodeResults {
				replicated, deleted, _ := ss.repairCid(cid, tracker.CleanupMode, &expectedContentSize)
				tracker.NumCIDsChecked++
				if replicated {
					tracker.NumCIDsReplicated++
				} else if deleted {
					tracker.NumCIDsDeleted++
				}
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
			 limit 5000`, tracker.CursorQmCID)

		if err != nil {
			return err
		}
		if len(cidBatch) == 0 {
			break
		}
		for _, cid := range cidBatch {
			tracker.CursorQmCID = cid
			replicated, deleted, _ := ss.repairCid(cid, tracker.CleanupMode, &expectedContentSize)
			tracker.NumCIDsChecked++
			if replicated {
				tracker.NumCIDsReplicated++
			} else if deleted {
				tracker.NumCIDsDeleted++
			}
		}

		tracker.Duration += time.Since(startIter)
		saveTracker()
	}

	ss.expectedContentSize = expectedContentSize
	tracker.ContentSize = expectedContentSize
	return nil
}

func (ss *MediorumServer) repairCid(cid string, cleanupMode bool, expectedContentSize *int64) (replicated, deleted bool, err error) {
	ctx := context.Background()
	logger := ss.logger.With("task", "repair", "cid", cid, "cleanup", cleanupMode)

	preferredHosts, isMine := ss.rendezvousAllHosts(cid)
	preferredHealthyHosts, isMineHealthy := ss.rendezvousHealthyHosts(cid)

	// use preferredHealthyHosts when determining my rank because we want to check if we're in the top N*2 healthy nodes not the top N*2 unhealthy nodes
	myRank := slices.Index(preferredHealthyHosts, ss.Config.Self.Host)

	key := cidutil.ShardCID(cid)
	alreadyHave := true
	attrs := &blob.Attributes{}
	attrs, err = ss.bucket.Attributes(ctx, key)
	if err != nil {
		if gcerrors.Code(err) == gcerrors.NotFound {
			attrs = &blob.Attributes{}
			alreadyHave = false
		} else {
			logger.Error("exist check failed", "err", err)
			return
		}
	}

	// in cleanup mode do some extra checks:
	// - validate CID, delete if invalid (doesn't apply to Qm keys because their hash is not the CID)
	if cleanupMode && alreadyHave && !cidutil.IsLegacyCID(cid) {
		if r, errVal := ss.bucket.NewReader(ctx, key, nil); errVal == nil {
			errVal := cidutil.ValidateCID(cid, r)
			r.Close()
			if err != nil {
				logger.Error("deleting invalid CID", "err", errVal)
				if errDel := ss.bucket.Delete(ctx, key); errDel == nil {
					deleted = true
				} else {
					logger.Error("failed to delete invalid CID", "err", errDel)
				}
				return
			}
		}
	}

	if alreadyHave {
		*expectedContentSize += attrs.Size
	}

	// get blobs that I should have (regardless of health of other nodes)
	if isMine && !alreadyHave && ss.diskHasSpace() {
		success := false
		// loop preferredHosts (not preferredHealthyHosts) because pullFileFromHost can still give us a file even if we thought the host was unhealthy
		for _, host := range preferredHosts {
			if host == ss.Config.Self.Host {
				continue
			}
			err := ss.pullFileFromHost(host, cid)
			if err != nil {
				logger.Error("pull failed (blob I should have)", "err", err, "host", host)
			} else {
				logger.Info("pull OK (blob I should have)", "host", host)
				success = true
				break
			}
		}
		if success {
			replicated = true
			pulledAttrs, errAttrs := ss.bucket.Attributes(ctx, key)
			if errAttrs != nil {
				*expectedContentSize += pulledAttrs.Size
			}
			return
		} else {
			logger.Warn("failed to pull from any host", "hosts", preferredHosts)
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
				*expectedContentSize -= attrs.Size
				deleted = true
				return
			}
		}
	}

	// replicate under-replicated blobs:
	// even tho this blob isn't "mine"
	// in cleanup mode the top N*2 healthy nodes will check to see if it's under-replicated
	// and pull file if under-replicated
	if cleanupMode && !isMine && !alreadyHave && myRank >= 0 && myRank < ss.Config.ReplicationFactor*2 && ss.diskHasSpace() {
		hasIt := []string{}
		// loop preferredHosts (not preferredHealthyHosts) because hostHasBlob is the real source of truth for if a node can serve a blob (not our health info about the host, which could be outdated)
		for _, host := range preferredHosts {
			if ss.hostHasBlob(host, cid) {
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
					logger.Error("pull failed (under-replicated)", err, "host", host)
				} else {
					logger.Info("pull OK (under-replicated)", "host", host)
					success = true
					break
				}
			}
			if success {
				pulledAttrs, errAttrs := ss.bucket.Attributes(ctx, key)
				if errAttrs != nil {
					*expectedContentSize += pulledAttrs.Size
				}
				replicated = true
				return
			} else {
				logger.Warn("failed to pull from any host", "hosts", preferredHosts)
			}
		}
	}

	return
}

func (ss *MediorumServer) serveRepairLogs(c echo.Context) error {
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
