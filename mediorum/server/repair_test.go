package server

import (
	"bytes"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestRepair(t *testing.T) {
	replicationFactor := 5

	ss := testNetwork[0]

	// first, write a blob only to my storage
	data := []byte("repair test")
	cid, err := computeFileCID(bytes.NewReader(data))
	assert.NoError(t, err)
	err = ss.replicateToMyBucket(cid, bytes.NewReader(data))
	assert.NoError(t, err)

	// verify it reports as under-replicated
	{
		problems, err := ss.findProblemBlobs(false)
		assert.NoError(t, err)
		assert.Equal(t, problems[0].Key, cid)
		assert.Equal(t, problems[0].R, 1)
	}

	// tell all servers do repair
	for _, s := range testNetwork {
		err = s.repairUnderReplicatedBlobs()
		assert.NoError(t, err)
	}

	// wait for crud replication
	time.Sleep(time.Millisecond * 100)

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
		ss.replicateFileToHost(server.Config.Self, cid, bytes.NewReader(data))
	}

	// wait for crud
	time.Sleep(time.Millisecond * 100)

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

	// tell all servers to do cleanup
	for _, server := range testNetwork {
		err = server.cleanupOverReplicatedBlobs()
		assert.NoError(t, err)
	}

	// wait for crud replication
	time.Sleep(time.Millisecond * 100)

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
