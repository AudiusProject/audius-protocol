package server

import (
	"bytes"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestRepair(t *testing.T) {
	replicationFactor := 5
	crudrWait := time.Millisecond * 300

	runTestNetworkRepair := func(cleanup bool) {
		wg := sync.WaitGroup{}
		wg.Add(len(testNetwork))
		for _, s := range testNetwork {
			s := s
			go func() {
				err := s.runRepair(cleanup)
				assert.NoError(t, err)
				wg.Done()
			}()
		}
		wg.Wait()
	}

	ss := testNetwork[0]

	// first, write a blob only to my storage
	data := []byte("repair test")
	cid, err := computeFileCID(bytes.NewReader(data))
	assert.NoError(t, err)
	err = ss.replicateToMyBucket(cid, bytes.NewReader(data))
	assert.NoError(t, err)

	time.Sleep(crudrWait)

	// verify it reports as under-replicated
	{
		problems, err := ss.findProblemBlobs(false)
		assert.NoError(t, err)
		assert.Equal(t, problems[0].Key, cid)
		assert.Equal(t, problems[0].R, 1)
	}

	// tell all servers do repair
	runTestNetworkRepair(false)

	// wait for crud replication
	time.Sleep(crudrWait)

	// verify replicated + not a problem
	{
		problems, err := ss.findProblemBlobs(false)
		assert.NoError(t, err)
		assert.Len(t, problems, 0)

		blobs := []Blob{}
		ss.crud.DB.Where(Blob{Key: cid}).Find(&blobs)
		assert.Len(t, blobs, replicationFactor)
	}

	// --------------------------
	//
	// now over-replicate file
	//
	for _, server := range testNetwork {
		ss.replicateFileToHost(server.Config.Self.Host, cid, bytes.NewReader(data))
	}

	// wait for crud
	time.Sleep(crudrWait)

	// verify over-replicated
	{
		problems, err := ss.findProblemBlobs(true)
		assert.NoError(t, err)
		assert.Equal(t, problems[0].Key, cid)
		assert.Equal(t, problems[0].R, 9)

		blobs := []Blob{}
		ss.crud.DB.Where(Blob{Key: cid}).Find(&blobs)
		assert.True(t, len(blobs) == len(testNetwork))
	}

	// tell all servers do cleanup
	runTestNetworkRepair(true)

	// wait for crud replication
	time.Sleep(crudrWait)

	// verify all good
	{
		problems, err := ss.findProblemBlobs(false)
		assert.NoError(t, err)
		assert.Len(t, problems, 0)

		blobs := []Blob{}
		ss.crud.DB.Where(Blob{Key: cid}).Find(&blobs)
		assert.Equal(t, replicationFactor, len(blobs))
	}

}
