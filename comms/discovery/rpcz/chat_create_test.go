package rpcz

import (
	"fmt"
	"testing"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	"github.com/stretchr/testify/assert"
)

func TestChatCreate(t *testing.T) {
	user1IdEncoded, _ := misc.EncodeHashId(int(1))
	user2IdEncoded, _ := misc.EncodeHashId(int(2))
	chatId := fmt.Sprintf("%s:%s", user1IdEncoded, user2IdEncoded)
	if user2IdEncoded < user1IdEncoded {
		chatId = fmt.Sprintf("%s:%s", user2IdEncoded, user1IdEncoded)
	}

	var count int

	tsEarly := time.Now().Add(-time.Minute)
	tsLate := time.Now().Add(-time.Second)
	tsLater := time.Now()

	tx := db.Conn.MustBegin()

	// create a chat with a later timestamp
	err := chatCreate(tx, 1, tsLate, schema.ChatCreateRPCParams{
		ChatID: chatId,
		Invites: []schema.PurpleInvite{
			{UserID: user1IdEncoded, InviteCode: "later"},
			{UserID: user2IdEncoded, InviteCode: "later"},
		},
	})
	assert.NoError(t, err)

	// send a message in this errant chat
	chatSendMessage(tx, 1, chatId, "bad_message", tsLate, "this message is doomed")
	tx.QueryRow(`select count(*) from chat_message where chat_id = $1`, chatId).Scan(&count)
	assert.Equal(t, 1, count)

	// now create a "delayed" chat... that was timestamped earlier, but arrived later
	err = chatCreate(tx, 1, tsEarly, schema.ChatCreateRPCParams{
		ChatID: chatId,
		Invites: []schema.PurpleInvite{
			{UserID: user1IdEncoded, InviteCode: "earlier"},
			{UserID: user2IdEncoded, InviteCode: "earlier"},
		},
	})
	assert.NoError(t, err)

	// now create a "delayed" chat... that was timestamped later and arrives later
	err = chatCreate(tx, 1, tsLater, schema.ChatCreateRPCParams{
		ChatID: chatId,
		Invites: []schema.PurpleInvite{
			{UserID: user1IdEncoded, InviteCode: "even_later"},
			{UserID: user2IdEncoded, InviteCode: "even_later"},
		},
	})
	assert.NoError(t, err)

	// send a message in this earlier chat
	chatSendMessage(tx, 1, chatId, "good_message", tsLate, "this message is blessed")
	tx.QueryRow(`select count(*) from chat_message where chat_id = $1`, chatId).Scan(&count)
	assert.Equal(t, 1, count)

	err = tx.QueryRow(`select count(*) from chat_member where invite_code = 'earlier'`).Scan(&count)
	assert.NoError(t, err)
	assert.Equal(t, 2, count)

	err = tx.QueryRow(`select count(*) from chat_member where invite_code = 'later'`).Scan(&count)
	assert.NoError(t, err)
	assert.Equal(t, 0, count)

	tx.Commit()
}
