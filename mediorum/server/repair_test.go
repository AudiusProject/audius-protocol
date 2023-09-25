package server

import (
	"bytes"
	"context"
	"mediorum/cidutil"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestRepair(t *testing.T) {
	replicationFactor := 5

	runTestNetworkRepair := func(cleanup bool) {
		wg := sync.WaitGroup{}
		wg.Add(len(testNetwork))
		for _, s := range testNetwork {
			s := s
			go func() {
				err := s.runRepair(&RepairTracker{StartedAt: time.Now(), CleanupMode: cleanup, Counters: map[string]int{}})
				assert.NoError(t, err)
				wg.Done()
			}()
		}
		wg.Wait()
	}

	findHostsWithBlob := func(cid string) []string {
		ctx := context.Background()
		key := cidutil.ShardCID(cid)
		result := []string{}
		for _, s := range testNetwork {
			if ok, _ := s.bucket.Exists(ctx, key); ok {
				result = append(result, s.Config.Self.Host)
			}
		}
		return result
	}

	ss := testNetwork[0]

	// first, write a blob only to my storage
	data := []byte("repair test")
	cid, err := cidutil.ComputeFileCID(bytes.NewReader(data))
	assert.NoError(t, err)
	err = ss.replicateToMyBucket(cid, bytes.NewReader(data))
	assert.NoError(t, err)

	// create a dummy upload for it?
	ss.crud.Create(Upload{
		ID:          "testing",
		OrigFileCID: cid,
		CreatedAt:   time.Now(),
	})

	// verify we can get it "manually"
	{
		s2 := testNetwork[1]
		u, err := s2.peerGetUpload(ss.Config.Self.Host, "testing")
		assert.NoError(t, err)
		assert.Equal(t, cid, u.OrigFileCID)

		var uploads []Upload
		resp, err := s2.reqClient.R().SetSuccessResult(&uploads).Get(ss.Config.Self.Host + "/uploads")
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		assert.Len(t, uploads, 1)
	}

	// force sweep (since blob changes SkipBroadcast)
	for _, s := range testNetwork {
		s.crud.ForceSweep()
	}

	// assert it only exists on 1 host
	{
		hosts := findHostsWithBlob(cid)
		assert.Len(t, hosts, 1)
	}

	// tell all servers do repair
	runTestNetworkRepair(false)

	// assert it exists on R hosts
	{
		hosts := findHostsWithBlob(cid)
		assert.Len(t, hosts, replicationFactor)
	}

	// --------------------------
	//
	// now over-replicate file
	//
	for _, server := range testNetwork {
		ss.replicateFileToHost(server.Config.Self.Host, cid, bytes.NewReader(data))
	}

	// assert over-replicated
	{
		hosts := findHostsWithBlob(cid)
		assert.Len(t, hosts, len(testNetwork))
	}

	// tell all servers do cleanup
	runTestNetworkRepair(true)

	// assert R copies
	if false {
		hosts := findHostsWithBlob(cid)
		assert.Len(t, hosts, replicationFactor)
	}

	// ----------------------
	// now make one of the servers "lose" a file
	if false {
		byHost := map[string]*MediorumServer{}
		for _, s := range testNetwork {
			byHost[s.Config.Self.Host] = s
		}

		rendezvousOrder := []*MediorumServer{}
		preferred, _ := ss.rendezvousAllHosts(cid)
		for _, h := range preferred {
			rendezvousOrder = append(rendezvousOrder, byHost[h])
		}

		// make leader lose file
		leader := rendezvousOrder[0]
		leader.dropFromMyBucket(cid)

		// normally a standby server wouldn't pull this file
		standby := rendezvousOrder[replicationFactor+2]
		err = standby.runRepair(&RepairTracker{StartedAt: time.Now(), CleanupMode: false, Counters: map[string]int{}})
		assert.NoError(t, err)
		assert.False(t, standby.hostHasBlob(standby.Config.Self.Host, cid))

		// running repair in cleanup mode... standby will observe that #1 doesn't have blob so will pull it
		err = standby.runRepair(&RepairTracker{StartedAt: time.Now(), CleanupMode: true, Counters: map[string]int{}})
		assert.NoError(t, err)
		assert.True(t, standby.hostHasBlob(standby.Config.Self.Host, cid))

		// leader re-gets lost file when repair runs
		err = leader.runRepair(&RepairTracker{StartedAt: time.Now(), CleanupMode: false, Counters: map[string]int{}})
		assert.NoError(t, err)
		assert.True(t, leader.hostHasBlob(leader.Config.Self.Host, cid))

		// standby drops file after leader has it back
		err = standby.runRepair(&RepairTracker{StartedAt: time.Now(), CleanupMode: true, Counters: map[string]int{}})
		assert.NoError(t, err)
		assert.False(t, standby.hostHasBlob(standby.Config.Self.Host, cid))
	}

}
