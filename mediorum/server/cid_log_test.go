package server

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCidLog(t *testing.T) {
	ctx := context.Background()

	s1 := testNetwork[0]
	s2 := testNetwork[1]

	// since we're about to truncate "Files"
	// let's just double tripple check we're in test mode:
	assert.Equal(t, "test", s1.Config.Env)

	_, err := s1.pgPool.Exec(ctx, `
	truncate "Files";
	truncate cid_log;

	insert into "Files"
		(multihash, "storagePath", "createdAt", "updatedAt", "fileUUID", "clock", "skipped")
	values
		('cid1', '/files/cid1', now(), now(), gen_random_uuid(), 1, false),
		('cid2', '/files/cid2', now(), now(), gen_random_uuid(), 1, false)
	`)
	assert.NoError(t, err)

	_, err = s2.pgPool.Exec(ctx, `truncate cid_lookup; truncate cid_cursor`)
	assert.NoError(t, err)

	r1, err := s2.beamFromPeer(s1.Config.Self)
	assert.NoError(t, err)
	assert.True(t, r1.CursorBefore.IsZero())
	assert.False(t, r1.CursorAfter.IsZero())
	assert.EqualValues(t, 2, r1.RowCount)
	assert.EqualValues(t, 2, r1.InsertCount)
	assert.EqualValues(t, 0, r1.DeleteCount)

	var lookupCount, cursorCount int
	s2.pgPool.QueryRow(ctx, `select count(*) from cid_lookup`).Scan(&lookupCount)
	s2.pgPool.QueryRow(ctx, `select count(*) from cid_cursor`).Scan(&cursorCount)

	assert.EqualValues(t, 2, lookupCount)
	assert.EqualValues(t, 1, cursorCount)

	// do a delete
	{
		_, err := s1.pgPool.Exec(ctx, `delete from "Files" where multihash = 'cid1'`)
		assert.NoError(t, err)

		r1, err := s2.beamFromPeer(s1.Config.Self)
		assert.NoError(t, err)
		assert.False(t, r1.CursorBefore.IsZero())
		assert.EqualValues(t, 1, r1.RowCount)
		assert.EqualValues(t, 0, r1.InsertCount)
		assert.EqualValues(t, 1, r1.DeleteCount)

		s2.pgPool.QueryRow(ctx, `select count(*) from cid_lookup`).Scan(&lookupCount)
		assert.EqualValues(t, 1, lookupCount)
	}

}
