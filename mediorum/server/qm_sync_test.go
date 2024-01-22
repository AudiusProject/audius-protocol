package server

import (
	"context"
	"io"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestQmSync(t *testing.T) {
	ctx := context.Background()

	ss := testNetwork[0]

	_, err := ss.pgPool.Exec(ctx, `insert into qm_cids values ('Qm1'), ('Qm2'), ('Qm3') on conflict do nothing`)
	assert.NoError(t, err)
	err = ss.writeQmFile()
	assert.NoError(t, err)

	// read it back out
	blobReader, err := ss.bucket.NewReader(ctx, _qmFileKey, nil)
	assert.NoError(t, err)

	cool, err := io.ReadAll(blobReader)
	assert.NoError(t, err)
	assert.Equal(t, "Qm1 Qm2 Qm3 ", strings.ReplaceAll(string(cool), "\n", " "))

	s2 := testNetwork[1]

	_, err = s2.pgPool.Exec(ctx, "truncate qm_cids, qm_sync")
	assert.NoError(t, err)

	s2count := -1
	s2.pgPool.QueryRow(ctx, "select count(*) from qm_cids").Scan(&s2count)
	assert.Equal(t, 0, s2count)

	s2done := false
	s2.pgPool.QueryRow(ctx, "select count(*) = 1 from qm_sync where host = $1", ss.Config.Self.Host).Scan(&s2done)
	assert.False(t, s2done)

	err = s2.pullQmFromPeer(ss.Config.Self.Host)
	assert.NoError(t, err)

	s2.pgPool.QueryRow(ctx, "select count(*) from qm_cids").Scan(&s2count)
	assert.Equal(t, 3, s2count)

	s2.pgPool.QueryRow(ctx, "select count(*) = 1 from qm_sync where host = $1", ss.Config.Self.Host).Scan(&s2done)
	assert.True(t, s2done)

	var qm string
	s2.pgPool.QueryRow(ctx, "select * from qm_cids order by key").Scan(&qm)
	assert.Equal(t, "Qm1", qm)

	// run it again
	err = s2.pullQmFromPeer(ss.Config.Self.Host)
	assert.NoError(t, err)

	// force duplicate run
	s2.pgPool.Exec(ctx, "truncate qm_sync")
	err = s2.pullQmFromPeer(ss.Config.Self.Host)
	assert.NoError(t, err)
}
