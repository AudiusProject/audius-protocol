package rpcz

import (
	"context"
	"testing"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/db/queries"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	"github.com/stretchr/testify/assert"
)

func TestChatBlast(t *testing.T) {

	ctx := context.Background()
	tx := db.Conn.MustBegin()

	var count = 0
	var messages []queries.ChatMessageAndReactionsRow

	// helper funcs
	mustGetMessagesAndReactions := func(userID int32, chatID string) []queries.ChatMessageAndReactionsRow {
		messages, err := queries.ChatMessagesAndReactions(tx, ctx, queries.ChatMessagesAndReactionsParams{
			UserID: userID,
			ChatID: chatID,
			Limit:  10,
			Before: time.Now().Add(time.Hour * 12),
			After:  time.Now().Add(time.Hour * -12),
		})
		if err != nil {
			panic(err)
		}
		return messages
	}

	// create some follower audiuence
	_, err := tx.Exec(`insert into follows
		(follower_user_id, followee_user_id, is_current, is_delete, created_at, txhash)
	values
		(100, 69, true, false, now(), ''),
		(101, 69, true, false, now(), ''),
		(102, 69, true, false, now(), ''),
		(103, 69, true, false, now(), '')
	`)
	assert.NoError(t, err)

	// ----------------- some threads already exist -------------
	// user 100 starts a thread with 69 before first blast
	chatId_100_69 := misc.ChatID(100, 69)
	chatId_69_103 := misc.ChatID(69, 103)
	{
		err := chatCreate(tx, 100, time.Now(), schema.ChatCreateRPCParams{
			ChatID: chatId_100_69,
			Invites: []schema.PurpleInvite{
				{UserID: misc.MustEncodeHashID(100), InviteCode: "x"},
				{UserID: misc.MustEncodeHashID(69), InviteCode: "x"},
			},
		})
		assert.NoError(t, err)

		// send a message in chat
		err = chatSendMessage(tx, 100, chatId_100_69, "pre1", time.Now(), "100 here sending 69 a message")
		assert.NoError(t, err)

		messages = mustGetMessagesAndReactions(100, chatId_100_69)
		assert.Len(t, messages, 1)

		messages = mustGetMessagesAndReactions(69, chatId_100_69)
		assert.Len(t, messages, 1)
	}

	// user 69 starts empty thread with 103 before first blast
	{
		err := chatCreate(tx, 69, time.Now(), schema.ChatCreateRPCParams{
			ChatID: chatId_69_103,
			Invites: []schema.PurpleInvite{
				{UserID: misc.MustEncodeHashID(69), InviteCode: "x"},
				{UserID: misc.MustEncodeHashID(103), InviteCode: "x"},
			},
		})
		assert.NoError(t, err)
	}

	// ----------------- a first blast ------------------------
	chatId_101_69 := misc.ChatID(101, 69)

	err = chatBlast(tx, 69, time.Now(), schema.ChatBlastRPCParams{
		BlastID:  "b1",
		Audience: schema.FollowerAudience,
		Message:  "what up fam",
	})
	assert.NoError(t, err)

	tx.QueryRow(`select count(*) from chat_blast`).Scan(&count)
	assert.Equal(t, 1, count)

	tx.QueryRow(`select count(*) from chat where chat_id = $1`, chatId_101_69).Scan(&count)
	assert.Equal(t, 0, count)

	tx.QueryRow(`select count(*) from chat_member where chat_id = $1`, chatId_101_69).Scan(&count)
	assert.Equal(t, 0, count)

	tx.QueryRow(`select count(*) from chat_message where chat_id = $1`, chatId_101_69).Scan(&count)
	assert.Equal(t, 0, count)

	// user 100 (pre-existing) has a new message, but no new blasts
	{
		blasts, err := queries.GetNewBlasts(tx, ctx, queries.ChatMembershipParams{
			UserID: 100,
		})
		assert.NoError(t, err)
		assert.Len(t, blasts, 0)

		messages = mustGetMessagesAndReactions(100, chatId_100_69)
		assert.Len(t, messages, 2)

		messages = mustGetMessagesAndReactions(69, chatId_100_69)
		assert.Len(t, messages, 2)
	}

	// user 103 (pre-existing) has a new message, but no new blasts
	{
		blasts, err := queries.GetNewBlasts(tx, ctx, queries.ChatMembershipParams{
			UserID: 103,
		})
		assert.NoError(t, err)
		assert.Len(t, blasts, 0)

		messages = mustGetMessagesAndReactions(103, chatId_69_103)
		assert.Len(t, messages, 1)

		messages = mustGetMessagesAndReactions(69, chatId_69_103)
		assert.Len(t, messages, 1)
	}

	// user 101 has a blast
	{
		blasts, err := queries.GetNewBlasts(tx, ctx, queries.ChatMembershipParams{
			UserID: 101,
		})
		assert.NoError(t, err)
		assert.Len(t, blasts, 1)
	}

	// user 999 does not
	{
		blasts, err := queries.GetNewBlasts(tx, ctx, queries.ChatMembershipParams{
			UserID: 999,
		})
		assert.NoError(t, err)
		assert.Len(t, blasts, 0)
	}

	// user 101 upgrades it to a real DM
	{
		err = chatCreate(tx, 101, time.Now(), schema.ChatCreateRPCParams{
			ChatID: chatId_101_69,
			Invites: []schema.PurpleInvite{
				{UserID: misc.MustEncodeHashID(101), InviteCode: "earlier"},
				{UserID: misc.MustEncodeHashID(69), InviteCode: "earlier"},
			},
		})
		assert.NoError(t, err)

		tx.QueryRow(`select count(*) from chat where chat_id = $1`, chatId_101_69).Scan(&count)
		assert.Equal(t, 1, count)

		tx.QueryRow(`select count(*) from chat_member where chat_id = $1`, chatId_101_69).Scan(&count)
		assert.Equal(t, 2, count)

		tx.QueryRow(`select count(*) from chat_member where chat_id = $1 and user_id = 101`, chatId_101_69).Scan(&count)
		assert.Equal(t, 1, count)

		tx.QueryRow(`select count(*) from chat_member where chat_id = $1 and user_id = 69`, chatId_101_69).Scan(&count)
		assert.Equal(t, 1, count)

		tx.QueryRow(`select count(*) from chat_message where chat_id = $1`, chatId_101_69).Scan(&count)
		assert.Equal(t, 1, count)

		messages = mustGetMessagesAndReactions(101, chatId_101_69)
		assert.Len(t, messages, 1)
	}

	// after upgrade... user 101 has no pending blasts
	{
		blasts, err := queries.GetNewBlasts(tx, ctx, queries.ChatMembershipParams{
			UserID: 101,
		})
		assert.NoError(t, err)
		assert.Len(t, blasts, 0)
	}

	// after upgrade... user 101 has a chat
	{
		chats, err := queries.UserChats(tx, ctx, queries.UserChatsParams{
			UserID: 101,
			Limit:  10,
			Before: time.Now().Add(time.Hour * 12),
			After:  time.Now().Add(time.Hour * -12),
		})
		assert.NoError(t, err)
		assert.Len(t, chats, 1)
	}

	// ----------------- a second message ------------------------
	err = chatBlast(tx, 69, time.Now(), schema.ChatBlastRPCParams{
		BlastID:  "b2",
		Audience: schema.FollowerAudience,
		Message:  "happy wed",
	})
	assert.NoError(t, err)

	tx.QueryRow(`select count(*) from chat_blast`).Scan(&count)
	assert.Equal(t, 2, count)

	// user 101 above should have second blast added to the chat history...
	{
		chatId := misc.ChatID(101, 69)

		tx.QueryRow(`select count(*) from chat_message where chat_id = $1`, chatId).Scan(&count)
		assert.Equal(t, 2, count)

		messages = mustGetMessagesAndReactions(69, chatId)
		assert.Len(t, messages, 2)

		assert.Equal(t, "~what up fam", messages[0].Ciphertext)
		assert.Equal(t, "~happy wed", messages[1].Ciphertext)

		// user 101 reacts
		{
			heart := "heart"
			chatReactMessage(tx, 101, messages[0].MessageID, &heart, time.Now())

			// reaction shows up
			messages = mustGetMessagesAndReactions(69, chatId)
			assert.Equal(t, "heart", messages[0].Reactions[0].Reaction)
		}

	}

	err = tx.Rollback()
	assert.NoError(t, err)
}
