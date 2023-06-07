package server

import (
	"context"
	"fmt"
	"strings"
	"time"

	"golang.org/x/exp/slices"
)

func (ss *MediorumServer) startRepairer() {
	for i := 1; ; i++ {

		// run repair every minute?
		// set pretty low for the demo
		time.Sleep(time.Minute * 5)

		err := ss.repairUnderReplicatedBlobs()
		if err != nil {
			ss.logger.Warn("repair failed " + err.Error())
		}

		if i%2 == 0 {
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

func (ss *MediorumServer) findProblemBlobs(overReplicated bool) ([]ProblemBlob, error) {

	comparator := "<"
	if overReplicated {
		comparator = ">"
	}

	// make this really low for the demo
	healthyHosts := ss.findHealthyHostNames("5 minutes")

	problems := []ProblemBlob{}
	err := ss.crud.DB.Model(&Blob{}).
		Select("key, count(distinct host) as r, array_to_string(array_agg(distinct host), ',') as hosts").
		Where("host in ?", healthyHosts).
		Group("key").
		Having(fmt.Sprintf("count(distinct host) %s %d", comparator, ss.Config.ReplicationFactor)).
		Order("key").
		Scan(&problems).
		Error
	return problems, err
}

// WIP - come back to this and do counts cleanly
func (ss *MediorumServer) findProblemBlobsCount(overReplicated bool) (int64, error) {

	comparator := "<"
	if overReplicated {
		comparator = ">"
	}

	// make this really low for the demo
	healthyHosts := ss.findHealthyHostNames("1 minute")
	var count int64 = 0
	problems := []ProblemBlob{}
	err := ss.crud.DB.Model(&Blob{}).
		Select("key, count(distinct host) as r, array_to_string(array_agg(distinct host), ',') as hosts").
		Where("host in ?", healthyHosts).
		Group("key").
		Having(fmt.Sprintf("count(distinct host) %s %d", comparator, ss.Config.ReplicationFactor)).
		Order("key").
		Count(&count).
		Scan(&problems).
		Error
	return count, err
}

func (ss *MediorumServer) repairUnderReplicatedBlobs() error {
	// find under-replicated content
	ctx := context.Background()
	logger := ss.logger.With("svc", "repair")

	problems, err := ss.findProblemBlobs(false)
	if err != nil {
		return err
	}

	for _, problem := range problems {

		// if I have the file...
		// call replicate
		iHave := strings.Contains(problem.Hosts, ss.Config.Self.Host)
		if iHave {
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
	problems, err := ss.findProblemBlobs(true)
	if err != nil {
		return err
	}

	for _, problem := range problems {
		iHave := strings.Contains(problem.Hosts, ss.Config.Self.Host)
		if !iHave {
			continue
		}

		hosts := strings.Split(problem.Hosts, ",")
		myIdx := slices.Index(hosts, ss.Config.Self.Host)
		if myIdx+1 > ss.Config.ReplicationFactor {
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
