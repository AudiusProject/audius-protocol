package rpcz

import (
	"fmt"
	"math/rand"
	"strconv"
	"testing"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	"github.com/stretchr/testify/assert"
)

func TestChatBlocking(t *testing.T) {
	var err error

	// reset tables under test
	_, err = db.Conn.Exec("truncate table chat_blocked_users cascade")
	assert.NoError(t, err)
	_, err = db.Conn.Exec("truncate table chat cascade")
	assert.NoError(t, err)

	tx := db.Conn.MustBegin()

	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	user1Id := seededRand.Int31()
	user2Id := seededRand.Int31()

	assertBlocked := func(blockerUserId int32, blockeeUserId int32, timestamp time.Time, expected int) {
		row := tx.QueryRow("select count(*) from chat_blocked_users where blocker_user_id = $1 and blockee_user_id = $2 and created_at = $3", blockerUserId, blockeeUserId, timestamp)
		var count int
		err = row.Scan(&count)
		assert.NoError(t, err)
		assert.Equal(t, expected, count)
	}

	// validate user1Id can block user2Id
	{
		encodedUserId, err := misc.EncodeHashId(int(user2Id))
		assert.NoError(t, err)
		exampleRpc := schema.RawRPC{
			Params: []byte(fmt.Sprintf(`{"user_id": "%s"}`, encodedUserId)),
		}

		err = testValidator.validateChatBlock(tx, user1Id, exampleRpc)
		assert.NoError(t, err)
	}

	// user1Id blocks user2Id
	messageTs := time.Now()
	err = chatBlock(tx, user1Id, user2Id, messageTs)
	assert.NoError(t, err)
	assertBlocked(user1Id, user2Id, messageTs, 1)

	// assert no update if duplicate block requests
	duplicateMessageTs := time.Now()
	err = chatBlock(tx, user1Id, user2Id, duplicateMessageTs)
	assert.NoError(t, err)
	assertBlocked(user1Id, user2Id, messageTs, 1)
	assertBlocked(user1Id, user2Id, duplicateMessageTs, 0)

	// validate user1Id and user2Id cannot create a chat with each other
	{
		chatId := strconv.Itoa(seededRand.Int())
		user1IdEncoded, err := misc.EncodeHashId(int(user1Id))
		assert.NoError(t, err)
		user2IdEncoded, err := misc.EncodeHashId(int(user2Id))
		assert.NoError(t, err)

		exampleRpc := schema.RawRPC{
			Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "invites": [{"user_id": "%s", "invite_code": "1"}, {"user_id": "%s", "invite_code": "2"}]}`, chatId, user1IdEncoded, user2IdEncoded)),
		}

		err = testValidator.validateChatCreate(tx, user1Id, exampleRpc)
		assert.ErrorContains(t, err, "Cannot chat with a user you have blocked or user who has blocked you")
	}

	// validate user1Id and user2Id cannot message each other
	{
		// Assume chat was already created before blocking
		chatId := strconv.Itoa(seededRand.Int())
		SetupChatWithMembers(t, tx, chatId, user1Id, user2Id)

		exampleRpc := schema.RawRPC{
			Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message_id": "1", "message": "test"}`, chatId)),
		}

		err = testValidator.validateChatMessage(tx, user1Id, exampleRpc)
		assert.ErrorContains(t, err, "Cannot chat with a user you have blocked or user who has blocked you")
	}

	// user1Id unblocks user2Id
	err = chatUnblock(tx, user1Id, user2Id)
	assert.NoError(t, err)
	assertBlocked(user1Id, user2Id, messageTs, 0)

	tx.Rollback()
}
