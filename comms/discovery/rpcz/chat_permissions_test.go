package rpcz

import (
	"fmt"
	"math/rand"
	"strconv"
	"testing"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/schema"
	"github.com/jmoiron/sqlx"
	"github.com/stretchr/testify/assert"
)

func TestChatPermissions(t *testing.T) {
	var err error

	// reset tables under test
	_, err = db.Conn.Exec("truncate table chat_permissions cascade")
	assert.NoError(t, err)

	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	user1Id := seededRand.Int31()
	user2Id := seededRand.Int31()
	user3Id := seededRand.Int31()
	chat1Id := strconv.Itoa(seededRand.Int())
	chat2Id := strconv.Itoa(seededRand.Int())

	tx := db.Conn.MustBegin()

	// user 1 follows user 2
	_, err = tx.Exec("insert into follows (follower_user_id, followee_user_id, is_current, is_delete, created_at) values ($1, $2, true, false, now())", user1Id, user2Id)
	assert.NoError(t, err)
	// user 3 has tipped user 1
	_, err = tx.Exec("insert into user_tips (slot, signature, sender_user_id, receiver_user_id, amount) values (0, 'sig', $1, $2, 100)", user3Id, user1Id)
	assert.NoError(t, err)
	// user 1 has a chat with user 2
	SetupChatWithMembers(t, tx, chat1Id, user1Id, user2Id)
	// user 1 has a chat with user 3
	SetupChatWithMembers(t, tx, chat2Id, user1Id, user3Id)

	assertPermissionValidation := func(tx *sqlx.Tx, sender int32, chatId string, errorExpected bool) {
		exampleRpc := schema.RawRPC{
			Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message": "test123"}`, chatId)),
		}
		err = testValidator.validateChatMessage(tx, sender, exampleRpc)
		if errorExpected {
			assert.ErrorContains(t, err, "Not permitted to send messages to this user")
		} else {
			assert.NoError(t, err)
		}
	}

	// validate user1Id can set permissions
	{
		exampleRpc := schema.RawRPC{
			Params: []byte(fmt.Sprintf(`{"permit": "all"}`)),
		}

		err = testValidator.validateChatPermit(tx, user1Id, exampleRpc)
		assert.NoError(t, err)
	}

	// user 1 sets chat permissions to followees only
	err = chatSetPermissions(tx, int32(user1Id), schema.Followees)
	assert.NoError(t, err)
	// user 2 can message user 1 since 1 follows 2
	assertPermissionValidation(tx, user2Id, chat1Id, false)
	// user 3 cannot message user 1 since 1 does not follow 3
	assertPermissionValidation(tx, user3Id, chat2Id, true)

	// user 1 sets chat permissions to tippers only
	err = chatSetPermissions(tx, int32(user1Id), schema.Tippers)
	assert.NoError(t, err)
	// user 2 cannot message user 1 since 2 has never tipped 1
	assertPermissionValidation(tx, user2Id, chat1Id, true)
	// user 3 can message user 1 since 3 has tipped 1
	assertPermissionValidation(tx, user3Id, chat2Id, false)

	// user 1 changes chat permissions to none
	err = chatSetPermissions(tx, int32(user1Id), schema.None)
	assert.NoError(t, err)
	// no one can message user 1
	assertPermissionValidation(tx, user2Id, chat1Id, true)
	assertPermissionValidation(tx, user3Id, chat2Id, true)

	// user 1 changes chat permissions to all
	err = chatSetPermissions(tx, int32(user1Id), schema.All)
	assert.NoError(t, err)
	// anyone can message user 1
	assertPermissionValidation(tx, user2Id, chat1Id, false)
	assertPermissionValidation(tx, user3Id, chat2Id, false)

	tx.Rollback()
}
