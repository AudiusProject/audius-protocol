package rpcz

import (
	"testing"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/stretchr/testify/assert"
)

func SetupChatWithMembers(t *testing.T, tx *sqlx.Tx, chatId string, user1 int32, user2 int32) {
	var err error

	// create chat
	// - should create chat and initial self invite in one tx
	_, err = tx.Exec("insert into chat (chat_id, created_at, last_message_at) values ($1, $2, $2)", chatId, time.Now().UTC())
	assert.NoError(t, err)

	// insert two members
	_, err = tx.Exec("insert into chat_member (chat_id, invited_by_user_id, invite_code, user_id) values ($1, $2, $1, $2), ($1, $2, $1, $3)", chatId, user1, user2)
	assert.NoError(t, err)
}
