package rpcz

import (
	"database/sql"
	"fmt"
	"math/rand"
	"strconv"
	"testing"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/schema"
	"github.com/stretchr/testify/assert"
)

func TestChatDeletion(t *testing.T) {
	var err error

	// reset tables under test
	_, err = db.Conn.Exec("truncate table chat cascade")
	assert.NoError(t, err)

	tx := db.Conn.MustBegin()

	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	user1Id := seededRand.Int31()
	user2Id := seededRand.Int31()
	user3Id := seededRand.Int31()
	chatId := strconv.Itoa(seededRand.Int())

	SetupChatWithMembers(t, tx, chatId, user1Id, user2Id)

	assertDeleted := func(chatId string, userId int32, expectDeleted bool) {
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

	// validate user1Id and user2Id can delete their chats
	{
		exampleRpc := schema.RawRPC{
			Params: []byte(fmt.Sprintf(`{"chat_id": "%s"}`, chatId)),
		}

		err = testValidator.validateChatDelete(tx, user1Id, exampleRpc)
		assert.NoError(t, err)

		err = testValidator.validateChatDelete(tx, user3Id, exampleRpc)
		assert.ErrorIs(t, err, sql.ErrNoRows)
	}

	// user1Id deletes the chat
	deleteTs := time.Now()
	err = chatDelete(tx, user1Id, chatId, deleteTs)
	assert.NoError(t, err)
	assertDeleted(chatId, user1Id, true)

	// chat is not deleted for user2Id
	assertDeleted(chatId, user2Id, false)

	tx.Rollback()
}
