package server

import (
	"context"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"golang.org/x/exp/slices"
	"gorm.io/gorm"
)

func (ss *MediorumServer) startRepairer() {
	for i := 0; ; i++ {
		time.Sleep(time.Minute)

		// convention based turn taking...
		// each minute only 1 server should initiate repair process
		// or, put another way, a server will wait N minutes between repair runs
		// where N = size of network.
		// This is to avoid the situation where every server is pushing files to peers at the same time
		// i.e. avoid self ddos
		if i%len(ss.Config.Peers) == ss.Config.MyIndex {
			continue
		}

		err := ss.repairUnderReplicatedBlobs()
		if err != nil {
			ss.logger.Warn("repair failed " + err.Error())
		}

		// 33% percent of time... clean up over-replicated
		if rand.Float32() < 0.33 {
			err := ss.cleanupOverReplicatedBlobs()
			if err != nil {
				ss.logger.Warn("cleanup failed " + err.Error())
			}
		}
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

	healthyHosts := ss.findHealthyHostNames("5 minutes")

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

func (ss *MediorumServer) repairUnderReplicatedBlobs() error {
	// find under-replicated content
	ctx := context.Background()
	logger := ss.logger.With("task", "repair")

	problems, err := ss.findProblemBlobs(false)
	if err != nil {
		return err
	}

	logger.Info("starting repair", "problem_blob_count", len(problems))

	for _, problem := range problems {

		// if I have the file...
		// call replicate
		iHave := strings.Contains(problem.Hosts, ss.Config.Self.Host)
		if iHave {
			logger.Info("replicate", "cid", problem.Key)
			blob, err := ss.bucket.NewReader(ctx, problem.Key, nil)
			if err != nil {
				logger.Warn("failed to read key", "key", problem.Key, "err", err)
				continue
			}
			defer blob.Close()

			hosts, err := ss.replicateFile(problem.Key, blob)
			if err != nil {
				logger.Warn("failed to replicate", "key", problem.Key, "err", err)
			} else {
				logger.Debug("repaired", "key", problem.Key, "hosts", hosts)
			}
		}
	}

	return nil
}

func (ss *MediorumServer) cleanupOverReplicatedBlobs() error {
	logger := ss.logger.With("task", "cleanup")

	problems, err := ss.findProblemBlobs(true)
	if err != nil {
		return err
	}

	logger.Info("starting cleanup", "problem_blob_count", len(problems))

	for _, problem := range problems {
		iHave := strings.Contains(problem.Hosts, ss.Config.Self.Host)
		if !iHave {
			continue
		}

		hosts := strings.Split(problem.Hosts, ",")
		myIdx := slices.Index(hosts, ss.Config.Self.Host)
		if myIdx+1 > ss.Config.ReplicationFactor {
			logger.Info("delete", "cid", problem.Key)
			err = ss.dropFromMyBucket(problem.Key)
			if err != nil {
				ss.logger.Warn("cleanup: delete failed", "err", err)
			} else {
				ss.logger.Debug("cleanup: deleted " + problem.Key)
			}
		}
	}

	return nil
}
