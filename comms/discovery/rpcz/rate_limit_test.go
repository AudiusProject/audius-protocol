package rpcz

import (
	"fmt"
	"math/rand"
	"strconv"
	"testing"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	"github.com/stretchr/testify/assert"
)

func TestRateLimit(t *testing.T) {
	var err error

	// reset tables under test
	_, err = db.Conn.Exec("truncate table chat cascade")
	assert.NoError(t, err)

	kv := testValidator.limiter.kv

	// Add test rules
	testRules := map[string]int{
		config.RateLimitTimeframeHours:             24,
		config.RateLimitMaxNumMessages:             3,
		config.RateLimitMaxNumMessagesPerRecipient: 2,
		config.RateLimitMaxNumNewChats:             2,
	}
	for rule, limit := range testRules {
		_, err := kv.PutString(rule, strconv.Itoa(limit))
		assert.NoError(t, err)
	}

	tx := db.Conn.MustBegin()

	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	user1Id := seededRand.Int31()
	user2Id := seededRand.Int31()
	user3Id := seededRand.Int31()
	user4Id := seededRand.Int31()
	user5Id := seededRand.Int31()

	user1IdEncoded, err := misc.EncodeHashId(int(user1Id))
	assert.NoError(t, err)
	user3IdEncoded, err := misc.EncodeHashId(int(user3Id))
	assert.NoError(t, err)
	user4IdEncoded, err := misc.EncodeHashId(int(user4Id))
	assert.NoError(t, err)
	user5IdEncoded, err := misc.EncodeHashId(int(user5Id))
	assert.NoError(t, err)

	// user1Id created a new chat with user2Id 48 hours ago
	chatId1 := strconv.Itoa(seededRand.Int())
	chatTs := time.Now().UTC().Add(-time.Hour * time.Duration(48))
	_, err = tx.Exec("insert into chat (chat_id, created_at, last_message_at) values ($1, $2, $2)", chatId1, chatTs)
	assert.NoError(t, err)
	_, err = tx.Exec("insert into chat_member (chat_id, invited_by_user_id, invite_code, user_id) values ($1, $2, $1, $2), ($1, $2, $1, $3)", chatId1, user1Id, user2Id)
	assert.NoError(t, err)

	// user1Id messaged user2Id 48 hours ago
	err = chatSendMessage(tx, user1Id, chatId1, "1", chatTs, "Hello")
	assert.NoError(t, err)

	// user1Id messages user2Id twice now
	message := "Hello today 1"
	messageRpc := schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message": "%s"}`, chatId1, message)),
	}
	err = testValidator.validateChatMessage(tx, user1Id, messageRpc)
	assert.NoError(t, err)
	err = chatSendMessage(tx, user1Id, chatId1, "2", time.Now().UTC(), message)
	assert.NoError(t, err)
	message = "Hello today 2"
	messageRpc = schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message": "%s"}`, chatId1, message)),
	}
	err = testValidator.validateChatMessage(tx, user1Id, messageRpc)
	assert.NoError(t, err)
	err = chatSendMessage(tx, user1Id, chatId1, "3", time.Now().UTC(), message)
	assert.NoError(t, err)

	// user1Id messages user2Id a 3rd time
	// Blocked by rate limiter (hit max # messages per recipient in the past 24 hours)
	message = "Hello again again."
	messageRpc = schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message": "%s"}`, chatId1, message)),
	}
	err = testValidator.validateChatMessage(tx, user1Id, messageRpc)
	assert.ErrorContains(t, err, "User has exceeded the maximum number of new messages")

	// user1Id creates a new chat with user3Id (1 chat created in 24h)
	chatId2 := strconv.Itoa(seededRand.Int())
	createRpc := schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "invites": [{"user_id": "%s", "invite_code": "%s"}, {"user_id": "%s", "invite_code": "%s"}]}`, chatId2, user1IdEncoded, chatId2, user3IdEncoded, chatId2)),
	}
	err = testValidator.validateChatCreate(tx, user1Id, createRpc)
	assert.NoError(t, err)
	SetupChatWithMembers(t, tx, chatId2, user1Id, user3Id)

	// user1Id messages user3Id
	// Still blocked by rate limiter (hit max # messages with user2Id in the past 24h)
	message = "Hi user3Id"
	messageRpc = schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message": "%s"}`, chatId2, message)),
	}
	err = testValidator.validateChatMessage(tx, user1Id, messageRpc)
	assert.ErrorContains(t, err, "User has exceeded the maximum number of new messages")

	// Remove message 3 from db so can test other rate limits
	_, err = tx.Exec("delete from chat_message where message_id = '3'")
	assert.NoError(t, err)

	// user1Id should be able to message user3Id now
	err = testValidator.validateChatMessage(tx, user1Id, messageRpc)
	assert.NoError(t, err)
	err = chatSendMessage(tx, user1Id, chatId2, "3", time.Now().UTC(), message)
	assert.NoError(t, err)

	// user1Id creates a new chat with user4Id (2 chats created in 24h)
	chatId3 := strconv.Itoa(seededRand.Int())
	createRpc = schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "invites": [{"user_id": "%s", "invite_code": "%s"}, {"user_id": "%s", "invite_code": "%s"}]}`, chatId3, user1IdEncoded, chatId3, user4IdEncoded, chatId3)),
	}
	err = testValidator.validateChatCreate(tx, user1Id, createRpc)
	assert.NoError(t, err)
	SetupChatWithMembers(t, tx, chatId3, user1Id, user4Id)

	// user1Id messages user4Id
	message = "Hi user4Id again"
	messageRpc = schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message": "%s"}`, chatId3, message)),
	}
	err = testValidator.validateChatMessage(tx, user1Id, messageRpc)
	assert.NoError(t, err)
	err = chatSendMessage(tx, user1Id, chatId3, "4", time.Now().UTC(), message)
	assert.NoError(t, err)

	// user1Id messages user4Id again (4th message to anyone in 24h)
	// Blocked by rate limiter (hit max # messages in the past 24 hours)
	message = "Hi user4Id again"
	messageRpc = schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message": "%s"}`, chatId3, message)),
	}
	err = testValidator.validateChatMessage(tx, user1Id, messageRpc)
	assert.ErrorContains(t, err, "User has exceeded the maximum number of new messages")

	// user1Id creates a new chat with user5Id (3 chats created in 24h)
	// Blocked by rate limiter (hit max # new chats)
	chatId4 := strconv.Itoa(seededRand.Int())
	createRpc = schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "invites": [{"user_id": "%s", "invite_code": "%s"}, {"user_id": "%s", "invite_code": "%s"}]}`, chatId4, user1IdEncoded, chatId2, user5IdEncoded, chatId4)),
	}
	err = testValidator.validateChatCreate(tx, user1Id, createRpc)
	assert.ErrorContains(t, err, "An invited user has exceeded the maximum number of new chats")

	tx.Rollback()
}
