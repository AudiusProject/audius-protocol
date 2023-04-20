package server

import (
	"context"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCidLog(t *testing.T) {
	fmt.Println("_________________________________")
	ctx := context.Background()

	s1 := testNetwork[0]
	s2 := testNetwork[1]

	// this truncate could be danger
	// should add some checks to ensure we never run this on a real DB
	s1.pgPool.Exec(ctx, `
	truncate cid_log;

	insert into "Files"
		(multihash, "storagePath", "createdAt", "updatedAt", "fileUUID", "clock", "skipped")
	values
		(gen_random_uuid(), gen_random_uuid(), now(), now(), gen_random_uuid(), 1, false),
		(gen_random_uuid(), gen_random_uuid(), now(), now(), gen_random_uuid(), 1, false)
	`)

	_, err := s2.pgPool.Exec(ctx, `truncate cid_lookup; truncate cid_cursor`)
	assert.NoError(t, err)

	err = s2.beamFromPeer(s1.Config.Self)
	assert.NoError(t, err)

	var lookupCount, cursorCount int
	s2.pgPool.QueryRow(ctx, `select count(*) from cid_lookup;`).Scan(&lookupCount)
	s2.pgPool.QueryRow(ctx, `select count(*) from cid_cursor;`).Scan(&cursorCount)

	assert.Equal(t, 2, lookupCount)
	assert.Equal(t, 1, cursorCount)

}
