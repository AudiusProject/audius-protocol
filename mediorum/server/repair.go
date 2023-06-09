package server

import (
	"fmt"
	"math/rand"
	"strings"
	"time"

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
	logger := ss.logger.With("task", "repair")

	problems, err := ss.findProblemBlobs(false)
	if err != nil {
		return err
	}

	logger.Info("starting repair", "problem_blob_count", len(problems))

	for _, problem := range problems {

		logger := logger.With("cid", problem.Key)

		// if is mine and don't have
		// pull from someone who does
		shouldHave := ss.placement.isMyHash(problem.Key)
		butDont := !strings.Contains(problem.Hosts, ss.Config.Self.Host)

		if shouldHave && butDont {
			hosts := strings.Split(problem.Hosts, ",")
			success := false
			for _, host := range hosts {
				err := ss.pullFileFromHost(host, problem.Key)
				if err != nil {
					logger.Error("pull failed", err, "host", host)
				} else {
					logger.Info("pull OK", "host", host)
					success = true
					break
				}
			}
			if !success {
				logger.Warn("failed to pull from any host", "hosts", hosts)
				// creator-node style... go down the list?  rendezvous?
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

		// don't delete a blob if we _should_ have it
		shouldHave := ss.placement.isMyHash(problem.Key)
		if shouldHave {
			continue
		}

		// can't delete a blob if we _don't_ have it
		dontHave := !strings.Contains(problem.Hosts, ss.Config.Self.Host)
		if dontHave {
			continue
		}

		logger := logger.With("cid", problem.Key)
		preferred := ss.placement.topAll(problem.Key)

		depth := 0
		for _, peer := range preferred {
			if ss.hostHasBlob(peer.Host, problem.Key, true) {
				depth++
			}
			if peer.Host == ss.Config.Self.Host {
				break
			}
		}

		if depth > ss.Config.ReplicationFactor {
			logger.Info("deleting", "depth", depth, "hosts", preferred)
			err = ss.dropFromMyBucket(problem.Key)
			if err != nil {
				logger.Error("delete failed", err)
			} else {
				logger.Info("delete OK")
			}
		}
	}

	return nil
}

// func (ss *MediorumServer) validateMyBlobs() error {
// 	// Find my blobs

// 	// for blob in my blobs:
// 	//   verify on disk?
// 	//   verify record?

// 	// maybe just add pull?

// }
