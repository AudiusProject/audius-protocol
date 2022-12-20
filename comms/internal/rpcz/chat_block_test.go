package rpcz

import (
	"fmt"
	"testing"
	"time"

	"comms.audius.co/db"
	"comms.audius.co/misc"
	"comms.audius.co/schema"
	"github.com/stretchr/testify/assert"
)

func TestChatBlocking(t *testing.T) {
	var err error

	// reset tables under test
	_, err = db.Conn.Exec("truncate chat_blocked_users cascade")
	assert.NoError(t, err)
	_, err = db.Conn.Exec("truncate chat cascade")
	assert.NoError(t, err)

	tx := db.Conn.MustBegin()

	// TODO test queries

	assertBlocked := func(blockerUserId int, blockeeUserId int, timestamp time.Time, expected int) {
		row := tx.QueryRow("select count(*) from chat_blocked_users where blocker_user_id = $1 and blockee_user_id = $2 and created_at = $3", blockerUserId, blockeeUserId, timestamp)
		var count int
		err = row.Scan(&count)
		assert.NoError(t, err)
		assert.Equal(t, expected, count)
	}

	// validate 91 can block 92
	{
		hashUserId, err := misc.EncodeHashId(92)
		assert.NoError(t, err)
		exampleRpc := schema.RawRPC{
			Params: []byte(fmt.Sprintf(`{"user_id": "%s"}`, hashUserId)),
		}

		chatBlock := string(schema.RPCMethodChatBlock)

		err = Validators[chatBlock](tx, 91, exampleRpc)
		assert.NoError(t, err)
	}

	// user 91 blocks 92
	messageTs := time.Now()
	err = chatBlock(tx, 91, 92, messageTs)
	assert.NoError(t, err)
	assertBlocked(91, 92, messageTs, 1)

	// assert no update if duplicate block requests
	duplicateMessageTs := time.Now()
	err = chatBlock(tx, 91, 92, duplicateMessageTs)
	assert.NoError(t, err)
	assertBlocked(91, 92, messageTs, 1)
	assertBlocked(91, 92, duplicateMessageTs, 0)

	// validate 91 and 92 cannot create a chat with each other
	{
		chatId := "chat1"
		user91HashId, err := misc.EncodeHashId(91)
		assert.NoError(t, err)
		user92HashId, err := misc.EncodeHashId(92)
		assert.NoError(t, err)

		exampleRpc := schema.RawRPC{
			Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "invites": [{"user_id": "%s", "invite_code": "1"}, {"user_id": "%s", "invite_code": "2"}]}`, chatId, user91HashId, user92HashId)),
		}

		chatCreate := string(schema.RPCMethodChatCreate)

		err = Validators[chatCreate](tx, 91, exampleRpc)
		assert.ErrorContains(t, err, "Cannot create a chat with a user you have blocked or user who has blocked you")
	}

	// validate 91 and 92 cannot message each other
	{
		// Assume chat was already created before blocking
		chatId := "chat1"
		SetUpChatWithMembers(t, tx, chatId, 91, 92)

		exampleRpc := schema.RawRPC{
			Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message_id": "1", "message": "test"}`, chatId)),
		}

		chatMessage := string(schema.RPCMethodChatMessage)

		err = Validators[chatMessage](tx, 91, exampleRpc)
		assert.ErrorContains(t, err, "Cannot sent messages to users you have blocked or users who have blocked you")
	}

	// user 91 unblocks 92
	err = chatUnblock(tx, 91, 92)
	assert.NoError(t, err)
	assertBlocked(91, 92, messageTs, 0)

	tx.Commit()
}
