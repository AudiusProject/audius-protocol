package rpcz

import (
	"testing"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/schema"
	"github.com/stretchr/testify/assert"
)

func TestChatBlast(t *testing.T) {

	tx := db.Conn.MustBegin()

	// create some follower audiuence
	_, err := tx.Exec(`insert into follows
		(follower_user_id, followee_user_id, is_current, is_delete, created_at, txhash)
	values
		(100, 69, true, false, now(), ''),
		(101, 69, true, false, now(), ''),
		(102, 69, true, false, now(), ''),
		(103, 69, true, false, now(), '')
	`)
	assert.NoError(t, err)

	// ----------------- a first message ------------------------
	err = chatBlast(tx, 69, time.Now(), schema.ChatBlastRPCParams{
		BlastID:  "b1",
		Audience: schema.FollowerAudience,
		Message:  "what fam",
	})
	assert.NoError(t, err)

	count := 0

	tx.QueryRow(`select count(*) from chat_blast`).Scan(&count)
	assert.Equal(t, 1, count)

	tx.QueryRow(`select count(*) from chat`).Scan(&count)
	assert.Equal(t, 4, count)

	tx.QueryRow(`select count(*) from chat_member`).Scan(&count)
	assert.Equal(t, 8, count)

	tx.QueryRow(`select count(*) from chat_message`).Scan(&count)
	assert.Equal(t, 4, count)

	// ----------------- a second message ------------------------
	err = chatBlast(tx, 69, time.Now(), schema.ChatBlastRPCParams{
		BlastID:  "b2",
		Audience: schema.FollowerAudience,
		Message:  "happy thursday",
	})
	assert.NoError(t, err)

	tx.QueryRow(`select count(*) from chat_blast`).Scan(&count)
	assert.Equal(t, 2, count)

	tx.QueryRow(`select count(*) from chat`).Scan(&count)
	assert.Equal(t, 4, count)

	tx.QueryRow(`select count(*) from chat_member`).Scan(&count)
	assert.Equal(t, 8, count)

	tx.QueryRow(`select count(*) from chat_message`).Scan(&count)
	assert.Equal(t, 8, count)

	tx.Rollback()
}
