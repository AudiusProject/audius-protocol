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

	// ----------------- a first message ------------------------
	err = chatBlast(tx, 69, time.Now(), schema.ChatBlastRPCParams{
		BlastID:  "b1",
		Audience: schema.FollowerAudience,
		Message:  "what fam",
	})
	assert.NoError(t, err)

	count := 0

	tx.QueryRow(`select count(*) from chat_blast`).Scan(&count)
	assert.Equal(t, 1, count)

	tx.QueryRow(`select count(*) from chat`).Scan(&count)
	assert.Equal(t, 0, count)

	tx.QueryRow(`select count(*) from chat_member`).Scan(&count)
	assert.Equal(t, 0, count)

	tx.QueryRow(`select count(*) from chat_message`).Scan(&count)
	assert.Equal(t, 0, count)

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
		chatId := misc.ChatID(101, 69)
		err = chatCreate(tx, 101, time.Now(), schema.ChatCreateRPCParams{
			ChatID: chatId,
			Invites: []schema.PurpleInvite{
				{UserID: misc.MustEncodeHashID(101), InviteCode: "earlier"},
				{UserID: misc.MustEncodeHashID(69), InviteCode: "earlier"},
			},
		})
		assert.NoError(t, err)

		tx.QueryRow(`select count(*) from chat where chat_id = $1`, chatId).Scan(&count)
		assert.Equal(t, 1, count)

		tx.QueryRow(`select count(*) from chat_member where chat_id = $1`, chatId).Scan(&count)
		assert.Equal(t, 2, count)

		tx.QueryRow(`select count(*) from chat_member where chat_id = $1 and user_id = 101`, chatId).Scan(&count)
		assert.Equal(t, 1, count)

		tx.QueryRow(`select count(*) from chat_member where chat_id = $1 and user_id = 69`, chatId).Scan(&count)
		assert.Equal(t, 1, count)

		tx.QueryRow(`select count(*) from chat_message where chat_id = $1`, chatId).Scan(&count)
		assert.Equal(t, 1, count)

		messages, err := queries.ChatMessagesAndReactions(tx, ctx, queries.ChatMessagesAndReactionsParams{
			UserID: 101,
			ChatID: chatId,
			Limit:  10,
			Before: time.Now().Add(time.Hour),
			After:  time.Now().Add(time.Hour * -1),
		})
		assert.NoError(t, err)
		assert.Len(t, messages, 1)

		// todo: new blasts should omit this one now

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

		messages, err := queries.ChatMessagesAndReactions(tx, ctx, queries.ChatMessagesAndReactionsParams{
			UserID: 69,
			ChatID: chatId,
			Limit:  10,
			Before: time.Now().Add(time.Hour),
			After:  time.Now().Add(time.Hour * -1),
		})
		assert.NoError(t, err)
		assert.Len(t, messages, 2)
	}

	err = tx.Rollback()
	assert.NoError(t, err)
}
