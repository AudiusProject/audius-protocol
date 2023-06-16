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

func TestChat(t *testing.T) {
	var err error

	// reset tables under test
	_, err = db.Conn.Exec("truncate table chat cascade")
	assert.NoError(t, err)

	tx := db.Conn.MustBegin()

	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	chatId := strconv.Itoa(seededRand.Int())
	user1Id := seededRand.Int31()
	user2Id := seededRand.Int31()
	user3Id := seededRand.Int31()

	SetupChatWithMembers(t, tx, chatId, user1Id, user2Id)

	// validate user1Id and user2Id can both send messages in this chat
	{
		exampleRpc := schema.RawRPC{
			Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message": "test123"}`, chatId)),
		}

		err = testValidator.validateChatMessage(tx, user1Id, exampleRpc)
		assert.NoError(t, err)

		err = testValidator.validateChatMessage(tx, user3Id, exampleRpc)
		assert.ErrorIs(t, err, sql.ErrNoRows)
	}

	// user1Id sends user2Id a message
	messageTs := time.Now()
	messageId := strconv.Itoa(seededRand.Int())
	err = chatSendMessage(tx, user1Id, chatId, messageId, messageTs, "hello user2Id")
	assert.NoError(t, err)

	// assertUnreadCount helper fun in a closure
	assertUnreadCount := func(chatId string, userId int32, expected int) {
		unreadCount := 0
		err := tx.Get(&unreadCount, "select unread_count from chat_member where chat_id = $1 and user_id = $2", chatId, userId)
		assert.NoError(t, err)
		assert.Equal(t, expected, unreadCount)
	}

	assertReaction := func(userId int32, messageId string, expected *string) {
		var reaction string
		err := tx.Get(&reaction, "select reaction from chat_message_reactions where user_id = $1 and message_id = $2", userId, messageId)
		if expected != nil {
			assert.NoError(t, err)
			assert.Equal(t, *expected, reaction)
		} else {
			assert.ErrorIs(t, err, sql.ErrNoRows)
		}
	}

	// assert sender has no unread messages
	assertUnreadCount(chatId, user1Id, 0)

	// assert user2Id has one unread message
	assertUnreadCount(chatId, user2Id, 1)

	// user2Id reads message
	chatReadMessages(tx, user2Id, chatId, time.Now())

	// assert user2Id has zero unread messages
	assertUnreadCount(chatId, user2Id, 0)

	// user2Id sends a reply to user1Id
	replyTs := time.Now()
	replyMessageId := "2"
	err = chatSendMessage(tx, user2Id, chatId, replyMessageId, replyTs, "oh hey there user1 thanks for your message")
	assert.NoError(t, err)

	// the tables have turned!
	assertUnreadCount(chatId, user2Id, 0)
	assertUnreadCount(chatId, user1Id, 1)

	// validate user1Id and user2Id can both send reactions in this chat
	{
		exampleRpc := schema.RawRPC{
			Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message_id": "%s", "reaction": "heart"}`, chatId, replyMessageId)),
		}

		err = testValidator.validateChatReact(tx, user1Id, exampleRpc)
		assert.NoError(t, err)

		err = testValidator.validateChatReact(tx, user3Id, exampleRpc)
		assert.ErrorIs(t, err, sql.ErrNoRows)
	}

	// user1Id reacts to user2Id's message
	reactTs := time.Now()
	reaction := "fire"
	err = chatReactMessage(tx, user1Id, replyMessageId, &reaction, reactTs)
	assertReaction(user1Id, replyMessageId, &reaction)

	// user1Id changes reaction to user2Id's message
	changedReactTs := time.Now()
	newReaction := "heart"
	err = chatReactMessage(tx, user1Id, replyMessageId, &newReaction, changedReactTs)
	assertReaction(user1Id, replyMessageId, &newReaction)

	// user1Id removes reaction to user2Id's message
	removedReactTs := time.Now()
	err = chatReactMessage(tx, user1Id, replyMessageId, nil, removedReactTs)
	assertReaction(user1Id, replyMessageId, nil)

	tx.Rollback()
}
