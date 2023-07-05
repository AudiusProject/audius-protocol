package rpcz

import (
	"testing"
	"time"

	"comms.audius.co/discovery/db"
	"github.com/stretchr/testify/assert"
)

func TestBan(t *testing.T) {
	time1 := time.Now().Add(-time.Minute * 3)
	time2 := time.Now().Add(-time.Minute * 2)
	time3 := time.Now().Add(-time.Minute * 1)

	tx := db.Conn.MustBegin()
	defer tx.Rollback()

	// ban
	err := upsertUserBan(tx, "1", true, time1)
	assert.NoError(t, err)
	assert.True(t, testValidator.isBanned(tx, 1))

	// unban
	err = upsertUserBan(tx, "1", false, time3)
	assert.NoError(t, err)
	assert.False(t, testValidator.isBanned(tx, 1))

	// ban rpc arrives late... should be ignored
	err = upsertUserBan(tx, "1", true, time2)
	assert.NoError(t, err)
	assert.False(t, testValidator.isBanned(tx, 1))

}
