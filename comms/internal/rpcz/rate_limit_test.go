package rpcz

import (
	"fmt"
	"strconv"
	"testing"
	"time"

	"comms.audius.co/config"
	"comms.audius.co/db"
	"comms.audius.co/jetstream"
	"comms.audius.co/misc"
	"comms.audius.co/schema"
	"github.com/nats-io/nats-server/v2/server"
	"github.com/nats-io/nats-server/v2/test"
	"github.com/nats-io/nats.go"
	"github.com/stretchr/testify/assert"
)

func TestRateLimit(t *testing.T) {
	var err error

	// reset tables under test
	_, err = db.Conn.Exec("truncate chat cascade;")
	assert.NoError(t, err)

	// Connect to NATS and create JetStream Context
	opts := server.Options{
		Host:      "127.0.0.1",
		Port:      4222,
		JetStream: true,
	}
	natsServer := test.RunServer(&opts)
	defer natsServer.Shutdown()
	nc, err := nats.Connect(nats.DefaultURL)
	assert.NoError(t, err)
	defer nc.Close()
	js, err := nc.JetStream(nats.PublishAsyncMaxPending(256))
	assert.NoError(t, err)
	jetstream.SetJetstreamContext(js)

	// Create rate limit KV
	kv, err := js.CreateKeyValue(&nats.KeyValueConfig{
		Bucket:   config.RateLimitRulesBucketName,
		Replicas: 1,
	})
	assert.NoError(t, err)

	// Replce rules with test rules
	testRules := map[string]int{
		config.RateLimitTimeframeHours:             24,
		config.RateLimitMaxNumMessages:             2,
		config.RateLimitMaxNumMessagesPerRecipient: 1,
		config.RateLimitMaxNumNewChats:             2,
	}
	for rule, limit := range testRules {
		_, err := kv.PutString(rule, strconv.Itoa(limit))
		assert.NoError(t, err)
	}

	tx := db.Conn.MustBegin()

	chatMessage := string(schema.RPCMethodChatMessage)
	chatCreate := string(schema.RPCMethodChatCreate)

	user91Encoded, err := misc.EncodeHashId(91)
	assert.NoError(t, err)
	user93Encoded, err := misc.EncodeHashId(93)
	assert.NoError(t, err)
	user94Encoded, err := misc.EncodeHashId(94)
	assert.NoError(t, err)
	user95Encoded, err := misc.EncodeHashId(95)
	assert.NoError(t, err)

	// 91 created a new chat with 92 48 hours ago
	chatId1 := "chat1"
	chatTs := time.Now().UTC().Add(-time.Hour * time.Duration(48))
	_, err = tx.Exec("insert into chat (chat_id, created_at, last_message_at) values ($1, $2, $2)", chatId1, chatTs)
	assert.NoError(t, err)
	_, err = tx.Exec("insert into chat_member (chat_id, invited_by_user_id, invite_code, user_id) values ($1, $2, $1, $2), ($1, $2, $1, $3)", chatId1, 91, 92)
	assert.NoError(t, err)

	// 91 messaged 92 48 hours ago
	err = chatSendMessage(tx, 91, chatId1, "1", chatTs, "Hello.")
	assert.NoError(t, err)

	// 91 messages 92 now
	message := "Hello again."
	messageRpc := schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message": "%s"}`, chatId1, message)),
	}
	err = Validators[chatMessage](tx, 91, messageRpc)
	assert.NoError(t, err)
	err = chatSendMessage(tx, 91, chatId1, "2", time.Now().UTC(), message)
	assert.NoError(t, err)

	// 91 messages 92 again. Blocked by rate limiter (hit max # messages per recipient in the past 24 hours)
	message = "Hello again again."
	messageRpc = schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message": "%s"}`, chatId1, message)),
	}
	err = Validators[chatMessage](tx, 91, messageRpc)
	assert.ErrorContains(t, err, "User has exceeded the maximum number of new messages per recipient")

	// 91 creates a new chat with 93
	chatId2 := "chat2"
	createRpc := schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "invites": [{"user_id": "%s", "invite_code": "%s"}, {"user_id": "%s", "invite_code": "%s"}]}`, chatId2, user91Encoded, chatId2, user93Encoded, chatId2)),
	}
	err = Validators[chatCreate](tx, 91, createRpc)
	assert.NoError(t, err)
	SetupChatWithMembers(t, tx, chatId2, 91, 93)

	// 91 messages 93
	message = "Hi 93"
	messageRpc = schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message": "%s"}`, chatId2, message)),
	}
	err = Validators[chatMessage](tx, 91, messageRpc)
	assert.NoError(t, err)
	err = chatSendMessage(tx, 91, chatId2, "3", time.Now().UTC(), message)
	assert.NoError(t, err)

	// 91 creates a new chat with 94
	chatId3 := "chat3"
	createRpc = schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "invites": [{"user_id": "%s", "invite_code": "%s"}, {"user_id": "%s", "invite_code": "%s"}]}`, chatId3, user91Encoded, chatId3, user94Encoded, chatId3)),
	}
	err = Validators[chatCreate](tx, 91, createRpc)
	assert.NoError(t, err)
	SetupChatWithMembers(t, tx, chatId3, 91, 94)

	// 91 messages 94. Blocked by rate limiter (hit max # messages in the past 24 hours)
	message = "Hi 94"
	messageRpc = schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "message": "%s"}`, chatId3, message)),
	}
	err = Validators[chatMessage](tx, 91, messageRpc)
	assert.ErrorContains(t, err, "User has exceeded the maximum number of new messages")

	// 91 creates a new chat with 95. Blocked by rate limiter (hit max # new chats)
	chatId4 := "chat4"
	createRpc = schema.RawRPC{
		Params: []byte(fmt.Sprintf(`{"chat_id": "%s", "invites": [{"user_id": "%s", "invite_code": "%s"}, {"user_id": "%s", "invite_code": "%s"}]}`, chatId4, user91Encoded, chatId2, user95Encoded, chatId4)),
	}
	err = Validators[chatCreate](tx, 91, createRpc)
	assert.ErrorContains(t, err, "An invited user has exceeded the maximum number of new chats")

	tx.Rollback()
}
