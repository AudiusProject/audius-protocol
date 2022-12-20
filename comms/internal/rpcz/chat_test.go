package rpcz

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"testing"
	"time"

	"comms.audius.co/db"
	"comms.audius.co/schema"
	"github.com/stretchr/testify/assert"
)

// this runs before all tests (not a per-test setup / teardown)
func TestMain(m *testing.M) {
	// setup
	os.Setenv("audius_db_url", "postgresql://postgres:postgres@localhost:5454/comtest?sslmode=disable")
	err := db.Dial()
	if err != nil {
		log.Fatal(err)
	}

	// run tests
	code := m.Run()

	// teardown code here...
	os.Exit(code)
}

func TestChat(t *testing.T) {
	var err error
	// ctx := context.Background()
	// query := db.New(db.Conn)

	chatId := "chat1"

	// reset tables under test
	_, err = db.Conn.Exec("truncate chat cascade")
	assert.NoError(t, err)

	tx := db.Conn.MustBegin()

	SetUpChatWithMembers(t, tx, chatId, 91, 92)

	// validate 91 and 92 can both send messages in this chat
	{
		exampleRpc := schema.RawRPC{
			Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message": "test123"}`, chatId)),
		}

		chatSay := string(schema.RPCMethodChatMessage)

		err = Validators[chatSay](tx, 91, exampleRpc)
		assert.NoError(t, err)

		err = Validators[chatSay](tx, 93, exampleRpc)
		assert.ErrorIs(t, err, sql.ErrNoRows)
	}

	// 91 sends 92 a message
	messageTs := time.Now()
	messageId := "1"
	err = chatSendMessage(tx, 91, chatId, messageId, messageTs, "hello 92")
	assert.NoError(t, err)

	// assertUnreadCount helper fun in a closure
	assertUnreadCount := func(chatId string, userId int, expected int) {
		unreadCount := 0
		err := tx.Get(&unreadCount, "select unread_count from chat_member where chat_id = $1 and user_id = $2", chatId, userId)
		assert.NoError(t, err)
		assert.Equal(t, expected, unreadCount)
	}

	assertReaction := func(userId int, messageId string, expected string) {
		var reaction string
		err := tx.Get(&reaction, "select reaction from chat_message_reactions where user_id = $1 and message_id = $2", userId, messageId)
		assert.NoError(t, err)
		assert.Equal(t, expected, reaction)
	}

	// assert sender has no unread messages
	assertUnreadCount(chatId, 91, 0)

	// assert 92 has one unread message
	assertUnreadCount(chatId, 92, 1)

	// 92 reads message
	chatReadMessages(tx, 92, chatId, time.Now())

	// assert 92 has zero unread messages
	assertUnreadCount(chatId, 92, 0)

	// 92 sends a reply to 91
	replyTs := time.Now()
	replyMessageId := "2"
	err = chatSendMessage(tx, 92, chatId, replyMessageId, replyTs, "oh hey there 91 thanks for your message")
	assert.NoError(t, err)

	// the tables have turned!
	assertUnreadCount(chatId, 92, 0)
	assertUnreadCount(chatId, 91, 1)

	// validate 91 and 92 can both send reactions in this chat
	{
		exampleRpc := schema.RawRPC{
			Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message_id": "%s", "reaction": "heart"}`, chatId, replyMessageId)),
		}

		chatReact := string(schema.RPCMethodChatReact)

		err = Validators[chatReact](tx, 91, exampleRpc)
		assert.NoError(t, err)

		err = Validators[chatReact](tx, 93, exampleRpc)
		assert.ErrorIs(t, err, sql.ErrNoRows)
	}

	// 91 reacts to 92's message
	reactTs := time.Now()
	reaction := "fire"
	err = chatReactMessage(tx, 91, replyMessageId, reaction, reactTs)
	assertReaction(91, replyMessageId, reaction)

	// 91 changes reaction to 92's old message
	changedReactTs := time.Now()
	newReaction := "heart"
	err = chatReactMessage(tx, 91, replyMessageId, newReaction, changedReactTs)
	assertReaction(91, replyMessageId, newReaction)

	tx.Commit()
}
