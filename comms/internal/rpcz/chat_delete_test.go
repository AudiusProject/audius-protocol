package rpcz

import (
	"database/sql"
	"fmt"
	"testing"
	"time"

	"comms.audius.co/db"
	"comms.audius.co/schema"
	"github.com/stretchr/testify/assert"
)

func TestChatDeletion(t *testing.T) {
	var err error

	// reset tables under test
	_, err = db.Conn.Exec("truncate chat cascade;")
	assert.NoError(t, err)

	tx := db.Conn.MustBegin()

	chatId := "chat1"
	SetupChatWithMembers(t, tx, chatId, 91, 92)

	assertDeleted := func(chatId string, userId int, expectDeleted bool) {
		row := tx.QueryRow("select cleared_history_at from chat_member where chat_id = $1 and user_id = $2", chatId, userId)
		var clearedHistoryAt sql.NullTime
		err = row.Scan(&clearedHistoryAt)
		assert.NoError(t, err)
		if expectDeleted {
			assert.True(t, clearedHistoryAt.Valid)
		} else {
			assert.False(t, clearedHistoryAt.Valid)
		}
	}

	// validate 91 and 92 can delete their chats
	{
		exampleRpc := schema.RawRPC{
			Params: []byte(fmt.Sprintf(`{"chat_id": "%s"}`, chatId)),
		}

		chatDelete := string(schema.RPCMethodChatDelete)

		err = Validators[chatDelete](tx, 91, exampleRpc)
		assert.NoError(t, err)

		err = Validators[chatDelete](tx, 93, exampleRpc)
		assert.ErrorIs(t, err, sql.ErrNoRows)
	}

	// 91 deletes the chat
	deleteTs := time.Now()
	err = chatDelete(tx, 91, chatId, deleteTs)
	assert.NoError(t, err)
	assertDeleted(chatId, 91, true)

	// chat is not deleted for 92
	assertDeleted(chatId, 92, false)

	tx.Rollback()
}
