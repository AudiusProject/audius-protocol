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

	tx.MustExec(`
	insert into user_tips
		(slot, signature, sender_user_id, receiver_user_id, amount, created_at, updated_at)
	values
		(1, 'c', $1, $2, 100, now(), now())
	`, user3Id, user1Id)

	assertPermissionValidation := func(tx *sqlx.Tx, sender int32, receiver int32, chatId string, errorExpected bool) {
		assertChatCreateAllowed(t, tx, sender, receiver, !errorExpected)
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
	err = chatSetPermissions(tx, int32(user1Id), schema.Followees, nil, nil, time.Now())
	assert.NoError(t, err)
	// user 2 can message user 1 since 1 follows 2
	assertPermissionValidation(tx, user2Id, user1Id, chat1Id, false)
	// user 3 cannot message user 1 since 1 does not follow 3
	assertPermissionValidation(tx, user3Id, user1Id, chat2Id, true)

	// user 1 sets chat permissions to tippers only
	err = chatSetPermissions(tx, int32(user1Id), schema.Tippers, nil, nil, time.Now())
	assert.NoError(t, err)
	// user 2 cannot message user 1 since 2 has never tipped 1
	assertPermissionValidation(tx, user2Id, user1Id, chat1Id, true)
	// user 3 can message user 1 since 3 has tipped 1
	assertPermissionValidation(tx, user3Id, user1Id, chat2Id, false)

	// user 1 changes chat permissions to none
	err = chatSetPermissions(tx, int32(user1Id), schema.None, nil, nil, time.Now())
	assert.NoError(t, err)
	// no one can message user 1
	assertPermissionValidation(tx, user2Id, user1Id, chat1Id, true)
	assertPermissionValidation(tx, user3Id, user1Id, chat2Id, true)

	// user 1 changes chat permissions to all
	err = chatSetPermissions(tx, int32(user1Id), schema.All, nil, nil, time.Now())
	assert.NoError(t, err)

	// meanwhile... a "late" permission update is ignored
	// the "all" setting should prevail
	err = chatSetPermissions(tx, int32(user1Id), schema.None, nil, nil, time.Now().Add(-time.Hour))
	assert.NoError(t, err)

	// anyone can message user 1
	assertPermissionValidation(tx, user2Id, user1Id, chat1Id, false)
	assertPermissionValidation(tx, user3Id, user1Id, chat2Id, false)

	tx.Rollback()
}

func assertChatCreateAllowed(t *testing.T, tx *sqlx.Tx, sender int32, receiver int32, shouldWork bool) {
	chatId := misc.ChatID(int(sender), int(receiver))
	senderEncoded := misc.MustEncodeHashID(int(sender))
	receiverEncoded := misc.MustEncodeHashID(int(receiver))
	exampleRpc := schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "invites": [{"user_id": "%s", "invite_code": "%s"}, {"user_id": "%s", "invite_code": "%s"}]}`, chatId, senderEncoded, senderEncoded, receiverEncoded, senderEncoded)),
	}
	err := testValidator.validateChatCreate(tx, sender, exampleRpc)
	if shouldWork {
		assert.NoError(t, err)
	} else {
		assert.ErrorContains(t, err, "Not permitted to send messages to this user")
	}
}
