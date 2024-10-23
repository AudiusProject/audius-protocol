package rpcz

import (
	"context"
	"fmt"
	"testing"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/db/queries"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	"github.com/stretchr/testify/assert"
)

func TestChatBlast(t *testing.T) {

	t0 := time.Now().Add(time.Second * -100).UTC()
	t1 := time.Now().Add(time.Second * -90).UTC()
	t2 := time.Now().Add(time.Second * -80).UTC()
	t3 := time.Now().Add(time.Second * -70).UTC()
	t4 := time.Now().Add(time.Second * -60).UTC()
	t5 := time.Now().Add(time.Second * -50).UTC()
	t6 := time.Now().Add(time.Second * -40).UTC()
	// t7 := time.Now().Add(time.Second * -30).UTC()

	trackContentType := schema.AudienceContentType("track")

	ctx := context.Background()
	tx := db.Conn.MustBegin()
	defer tx.Rollback()

	var count = 0
	var messages []queries.ChatMessageAndReactionsRow

	// helper funcs
	mustGetMessagesAndReactions := func(userID int32, chatID string) []queries.ChatMessageAndReactionsRow {
		messages, err := queries.ChatMessagesAndReactions(tx, ctx, queries.ChatMessagesAndReactionsParams{
			UserID: userID,
			ChatID: chatID,
			Limit:  10,
			Before: time.Now().Add(time.Hour * 2).UTC(),
			After:  time.Now().Add(time.Hour * -2).UTC(),
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
		(68, 69, true, false, $1, ''),
		(69, 68, true, false, $1, ''),
		(100, 69, true, false, $1, ''),
		(101, 69, true, false, $1, ''),
		(102, 69, true, false, $1, ''),
		(103, 69, true, false, $1, ''),
		(104, 69, true, false, $1, '')
	`, t0)
	assert.NoError(t, err)

	// Blaster (user 69) closes inbox
	// But recipients should still be able to upgrade.
	err = chatSetPermissions(tx, 69, schema.None, nil, nil, t0)
	assert.NoError(t, err)

	// Other user (104) closes inbox
	err = chatSetPermissions(tx, 104, schema.None, nil, nil, t0)
	assert.NoError(t, err)

	// ----------------- some threads already exist -------------
	// user 100 starts a thread with 69 before first blast
	chatId_100_69 := misc.ChatID(100, 69)
	chatId_69_103 := misc.ChatID(69, 103)
	{
		err := chatCreate(tx, 100, t1, schema.ChatCreateRPCParams{
			ChatID: chatId_100_69,
			Invites: []schema.PurpleInvite{
				{UserID: misc.MustEncodeHashID(100), InviteCode: "x"},
				{UserID: misc.MustEncodeHashID(69), InviteCode: "x"},
			},
		})
		assert.NoError(t, err)

		// send a message in chat
		err = chatSendMessage(tx, 100, chatId_100_69, "pre1", t1, "100 here sending 69 a message")
		assert.NoError(t, err)

		messages = mustGetMessagesAndReactions(100, chatId_100_69)
		assert.Len(t, messages, 1)
		assert.False(t, messages[0].IsPlaintext)

		messages = mustGetMessagesAndReactions(69, chatId_100_69)
		assert.Len(t, messages, 1)

		ch, err := queries.UserChat(tx, ctx, queries.ChatMembershipParams{
			UserID: 69,
			ChatID: chatId_100_69,
		})
		assert.NoError(t, err)
		assert.False(t, ch.LastMessageIsPlaintext)

		// user 69 now has 1 (real) chats
		chats, err := queries.UserChats(tx, ctx, queries.UserChatsParams{
			UserID: 69,
			Limit:  10,
			Before: time.Now().Add(time.Hour * 2).UTC(),
			After:  time.Now().Add(time.Hour * -2).UTC(),
		})
		assert.NoError(t, err)
		assert.Len(t, chats, 1)
	}

	// user 69 starts empty thread with 103 before first blast
	{
		err := chatCreate(tx, 69, t1, schema.ChatCreateRPCParams{
			ChatID: chatId_69_103,
			Invites: []schema.PurpleInvite{
				{UserID: misc.MustEncodeHashID(69), InviteCode: "x"},
				{UserID: misc.MustEncodeHashID(103), InviteCode: "x"},
			},
		})
		assert.NoError(t, err)

		// user 69 still has 1 (real) chats
		// because this is empty
		chats, err := queries.UserChats(tx, ctx, queries.UserChatsParams{
			UserID: 69,
			Limit:  10,
			Before: time.Now().Add(time.Hour * 2).UTC(),
			After:  time.Now().Add(time.Hour * -2).UTC(),
		})
		assert.NoError(t, err)
		assert.Len(t, chats, 1)
	}

	// ----------------- a first blast ------------------------
	chatId_101_69 := misc.ChatID(101, 69)

	_, err = chatBlast(tx, 69, t2, schema.ChatBlastRPCParams{
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

	// user 69 gets chat list...
	{
		// user 69 now has a (pre-existing) chat and a blast
		chats, err := queries.UserChats(tx, ctx, queries.UserChatsParams{
			UserID: 69,
			Limit:  10,
			Before: time.Now().Add(time.Hour * 2).UTC(),
			After:  time.Now().Add(time.Hour * -2).UTC(),
		})
		assert.NoError(t, err)
		assert.Len(t, chats, 2)

		blastCount := 0
		for _, c := range chats {
			if c.IsBlast {
				blastCount++
			}
		}
		assert.Equal(t, "D79jn:eYZmn", chats[1].ChatID)
		assert.Equal(t, 1, blastCount)
	}

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

	// user 104 has zero blasts (inbox closed)
	{
		blasts, err := queries.GetNewBlasts(tx, ctx, queries.ChatMembershipParams{
			UserID: 104,
		})
		assert.NoError(t, err)
		assert.Len(t, blasts, 0)
	}

	// user 999 does not
	{
		assertChatCreateAllowed(t, tx, 999, 69, false)

		blasts, err := queries.GetNewBlasts(tx, ctx, queries.ChatMembershipParams{
			UserID: 999,
		})
		assert.NoError(t, err)
		assert.Len(t, blasts, 0)
	}

	// user 101 upgrades it to a real DM
	{

		assertChatCreateAllowed(t, tx, 101, 69, true)

		err = chatCreate(tx, 101, t3, schema.ChatCreateRPCParams{
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

		tx.QueryRow(`select count(*) from chat_member where is_hidden = false and chat_id = $1 and user_id = 101`, chatId_101_69).Scan(&count)
		assert.Equal(t, 1, count)

		tx.QueryRow(`select count(*) from chat_member where is_hidden = true and chat_id = $1 and user_id = 69`, chatId_101_69).Scan(&count)
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

	// after upgrade... user 69 doesn't actually see the chat because it is hidden
	{
		chats, err := queries.UserChats(tx, ctx, queries.UserChatsParams{
			UserID: 69,
			Limit:  50,
			Before: time.Now().Add(time.Hour * 12),
			After:  time.Now().Add(time.Hour * -12),
		})
		assert.NoError(t, err)
		for _, chat := range chats {
			if chat.ChatID == chatId_101_69 {
				assert.Fail(t, "chat id should be hidden from user 69", chatId_101_69)
			}
		}
	}

	// artist view: user 69 can get this blast
	{
		chat, err := queries.UserChat(tx, ctx, queries.ChatMembershipParams{
			UserID: 69,
			ChatID: string(schema.FollowerAudience),
		})
		assert.NoError(t, err)
		assert.Equal(t, string(schema.FollowerAudience), chat.ChatID)
	}

	// ----------------- a second message ------------------------

	// Other user (104) re-opens inbox
	err = chatSetPermissions(tx, 104, schema.All, nil, nil, t3)
	assert.NoError(t, err)

	_, err = chatBlast(tx, 69, t4, schema.ChatBlastRPCParams{
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

		assert.Equal(t, "happy wed", messages[0].Ciphertext)
		assert.True(t, messages[0].IsPlaintext)
		assert.Equal(t, "what up fam", messages[1].Ciphertext)
		assert.True(t, messages[1].IsPlaintext)
		assert.Greater(t, messages[0].CreatedAt, messages[1].CreatedAt)

		ch, err := queries.UserChat(tx, ctx, queries.ChatMembershipParams{
			UserID: 69,
			ChatID: chatId,
		})
		assert.NoError(t, err)
		assert.True(t, ch.LastMessageIsPlaintext)
		assert.Equal(t, "happy wed", ch.LastMessage.String)

		// user 101 reacts
		{
			heart := "heart"
			chatReactMessage(tx, 101, chatId, messages[0].MessageID, &heart, t5)

			// reaction shows up
			messages = mustGetMessagesAndReactions(69, chatId)
			assert.Equal(t, "heart", messages[0].Reactions[0].Reaction)
		}

		if false {
			var debugRows []string
			tx.Select(&debugRows, `select row_to_json(c) from chat c;`)
			for _, d := range debugRows {
				fmt.Println("CHAT:", d)
			}
		}

	}

	// user 101 replies... now user 69 should see the thread
	{
		err = chatSendMessage(tx, 101, chatId_101_69, "respond_to_blast", t6, "101 responding to a blast from 69")
		assert.NoError(t, err)

		chats, err := queries.UserChats(tx, ctx, queries.UserChatsParams{
			UserID: 69,
			Limit:  50,
			Before: time.Now().Add(time.Hour * 12),
			After:  time.Now().Add(time.Hour * -12),
		})
		assert.NoError(t, err)
		found := false
		for _, chat := range chats {
			if chat.ChatID == chatId_101_69 {
				found = true
				break
			}
		}
		if !found {
			assert.Fail(t, "chat id should now be visible to user 69", chatId_101_69)
		}
	}

	// user 104 should have just 1 blast
	// since 104 opened inbox after first blast
	{
		blasts, err := queries.GetNewBlasts(tx, ctx, queries.ChatMembershipParams{
			UserID: 104,
		})
		assert.NoError(t, err)
		assert.Len(t, blasts, 1)

		// 104 does upgrade
		chatId_104_69 := misc.ChatID(104, 69)

		err = chatCreate(tx, 104, t6, schema.ChatCreateRPCParams{
			ChatID: chatId_104_69,
			Invites: []schema.PurpleInvite{
				{UserID: misc.MustEncodeHashID(104), InviteCode: "earlier"},
				{UserID: misc.MustEncodeHashID(69), InviteCode: "earlier"},
			},
		})
		assert.NoError(t, err)

		// 104 convo seeded with 1 message

		messages := mustGetMessagesAndReactions(104, chatId_104_69)
		assert.Len(t, messages, 1)
		messages = mustGetMessagesAndReactions(69, chatId_104_69)
		assert.Len(t, messages, 1)
	}

	// ------ sender can get blasts in a given thread ----------
	{
		chat, err := queries.UserChat(tx, ctx, queries.ChatMembershipParams{
			UserID: 69,
			ChatID: string(schema.FollowerAudience),
		})
		assert.NoError(t, err)
		assert.Equal(t, string(schema.FollowerAudience), chat.ChatID)

		messages, err := queries.ChatMessagesAndReactions(tx, ctx, queries.ChatMessagesAndReactionsParams{
			UserID:  69,
			ChatID:  "follower_audience",
			IsBlast: true,
			Before:  time.Now().Add(time.Hour * 2).UTC(),
			After:   time.Now().Add(time.Hour * -2).UTC(),
			Limit:   10,
		})
		assert.NoError(t, err)
		assert.Len(t, messages, 2)
	}

	// ------- bi-directional blasting works with upgrade --------

	// 69 re-opens inbox
	err = chatSetPermissions(tx, 69, schema.All, nil, nil, t1)
	assert.NoError(t, err)

	// 68 sends a blast
	chatId_68_69 := misc.ChatID(68, 69)

	_, err = chatBlast(tx, 68, t4, schema.ChatBlastRPCParams{
		BlastID:  "blast_from_68",
		Audience: schema.FollowerAudience,
		Message:  "I am 68",
	})
	assert.NoError(t, err)

	// one side does upgrade
	err = chatCreate(tx, 69, t5, schema.ChatCreateRPCParams{
		ChatID: chatId_68_69,
		Invites: []schema.PurpleInvite{
			{UserID: misc.MustEncodeHashID(68), InviteCode: "earlier"},
			{UserID: misc.MustEncodeHashID(69), InviteCode: "earlier"},
		},
	})
	assert.NoError(t, err)

	// both parties should have 3 messages message
	{
		messages := mustGetMessagesAndReactions(68, chatId_68_69)
		assert.Len(t, messages, 3)
	}

	// both parties should have 3 messages message
	{
		messages := mustGetMessagesAndReactions(69, chatId_68_69)
		assert.Len(t, messages, 3)
	}

	// -------------------------------- tipper audience

	// create some follower audiuence
	_, err = tx.Exec(`
	insert into user_tips
		(slot, signature, sender_user_id, receiver_user_id, amount, created_at, updated_at)
	values
		(1, 'd', 201, 69, 2, $1, $1)
	`, t0)
	assert.NoError(t, err)

	// 69 sends blast to supporters
	_, err = chatBlast(tx, 69, t1, schema.ChatBlastRPCParams{
		BlastID:  "blast_tippers_1",
		Audience: schema.TipperAudience,
		Message:  "thanks for your support",
	})
	assert.NoError(t, err)

	// 201 should have a pending blast
	{
		pending, err := queries.GetNewBlasts(tx, ctx, queries.ChatMembershipParams{
			UserID: 201,
		})
		assert.NoError(t, err)
		assert.Len(t, pending, 1)
	}

	// 69 upgrades
	chatId_69_201 := misc.ChatID(69, 201)
	err = chatCreate(tx, 101, t3, schema.ChatCreateRPCParams{
		ChatID: chatId_69_201,
		Invites: []schema.PurpleInvite{
			{UserID: misc.MustEncodeHashID(69), InviteCode: "earlier"},
			{UserID: misc.MustEncodeHashID(201), InviteCode: "earlier"},
		},
	})
	assert.NoError(t, err)

	// both users have 1 message
	{
		messages := mustGetMessagesAndReactions(69, chatId_69_201)
		assert.Len(t, messages, 1)
	}
	{
		messages := mustGetMessagesAndReactions(201, chatId_69_201)
		assert.Len(t, messages, 1)
	}

	// 201 should have no pending blast
	{
		pending, err := queries.GetNewBlasts(tx, ctx, queries.ChatMembershipParams{
			UserID: 201,
		})
		assert.NoError(t, err)
		assert.Len(t, pending, 0)
	}

	{
		chat, err := queries.UserChat(tx, ctx, queries.ChatMembershipParams{
			UserID: 69,
			ChatID: string(schema.TipperAudience),
		})
		assert.NoError(t, err)
		assert.Equal(t, string(schema.TipperAudience), chat.ChatID)
	}

	// -------------- remixer

	tx.MustExec(`
	INSERT INTO tracks
	   (track_id, is_current, is_delete, owner_id, created_at, updated_at)
	   VALUES
	   (1, true, false, 69, now(), now());

	INSERT INTO tracks
	   (track_id, is_current, is_delete, owner_id, created_at, updated_at)
	   VALUES
	   (2, true, false, 202, now(), now());

	   INSERT INTO remixes values (1,2);
	`)

	// 69 sends blast to remixers
	_, err = chatBlast(tx, 69, t1, schema.ChatBlastRPCParams{
		BlastID:             "blast_remixers_1",
		Audience:            schema.RemixerAudience,
		AudienceContentType: &trackContentType,
		AudienceContentID:   stringPointer(misc.MustEncodeHashID(1)),
		Message:             "thanks for your remix",
	})
	assert.NoError(t, err)

	{
		pending, err := queries.GetNewBlasts(tx, ctx, queries.ChatMembershipParams{
			UserID: 202,
		})
		assert.NoError(t, err)
		assert.Len(t, pending, 1)
	}

	// 69 sends another blast to all remixers
	_, err = chatBlast(tx, 69, t1, schema.ChatBlastRPCParams{
		BlastID:  "blast_remixers_2",
		Audience: schema.RemixerAudience,
		Message:  "new stems coming soon",
	})
	assert.NoError(t, err)

	{
		pending, err := queries.GetNewBlasts(tx, ctx, queries.ChatMembershipParams{
			UserID: 202,
		})
		assert.NoError(t, err)
		assert.Len(t, pending, 2)
	}

	// 202 upgrades... should have 2 messages
	chatId_202_69 := misc.ChatID(202, 69)
	err = chatCreate(tx, 202, t3, schema.ChatCreateRPCParams{
		ChatID: chatId_202_69,
		Invites: []schema.PurpleInvite{
			{UserID: misc.MustEncodeHashID(202), InviteCode: "earlier"},
			{UserID: misc.MustEncodeHashID(69), InviteCode: "earlier"},
		},
	})
	assert.NoError(t, err)

	// both users have 2 messages
	{
		messages := mustGetMessagesAndReactions(202, chatId_202_69)
		assert.Len(t, messages, 2)
	}
	{
		messages := mustGetMessagesAndReactions(69, chatId_202_69)
		assert.Len(t, messages, 2)
	}

	_, err = chatBlast(tx, 69, t1, schema.ChatBlastRPCParams{
		BlastID:             "blast_remixers_3",
		Audience:            schema.RemixerAudience,
		AudienceContentType: &trackContentType,
		AudienceContentID:   stringPointer(misc.MustEncodeHashID(1)),
		Message:             "yall are the best",
	})
	assert.NoError(t, err)

	// both users have 3 messages
	{
		messages := mustGetMessagesAndReactions(202, chatId_202_69)
		assert.Len(t, messages, 3)
	}
	{
		messages := mustGetMessagesAndReactions(69, chatId_202_69)
		assert.Len(t, messages, 3)
	}

	{
		blastChatId := "remixer_audience:track:" + misc.MustEncodeHashID(1)
		chat, err := queries.UserChat(tx, ctx, queries.ChatMembershipParams{
			UserID: 69,
			ChatID: blastChatId,
		})
		assert.NoError(t, err)
		assert.Equal(t, blastChatId, chat.ChatID)
	}

	{
		chat, err := queries.UserChat(tx, ctx, queries.ChatMembershipParams{
			UserID: 69,
			ChatID: "remixer_audience",
		})
		assert.NoError(t, err)
		assert.Equal(t, "remixer_audience", chat.ChatID)
	}

	// ------------- PURCHASE
	tx.MustExec(`
	insert into usdc_purchases
	(slot, signature, buyer_user_id, seller_user_id, amount, content_type, content_id, splits)
	values
	(0, '', 203, 69, 5.99, 'track', 1, 'null');
	`)

	_, err = chatBlast(tx, 69, t1, schema.ChatBlastRPCParams{
		BlastID:  "blast_customers_1",
		Audience: schema.CustomerAudience,
		// AudienceContentType: stringPointer("track"),
		// AudienceContentID:   stringPointer(misc.MustEncodeHashID(1)),
		Message: "thank you for yr purchase",
	})
	assert.NoError(t, err)

	{
		pending, err := queries.GetNewBlasts(tx, ctx, queries.ChatMembershipParams{
			UserID: 203,
		})
		assert.NoError(t, err)
		assert.Len(t, pending, 1)
	}

	{
		chat, err := queries.UserChat(tx, ctx, queries.ChatMembershipParams{
			UserID: 69,
			ChatID: "customer_audience",
		})
		assert.NoError(t, err)
		assert.Equal(t, "customer_audience", chat.ChatID)
	}

	// no blasts for a specific track customer yet... so this is a not found error
	{
		_, err := queries.UserChat(tx, ctx, queries.ChatMembershipParams{
			UserID: 69,
			ChatID: "customer_audience:track:1",
		})
		assert.Error(t, err)
	}

	err = tx.Rollback()
	assert.NoError(t, err)
}

func stringPointer(val string) *string {
	return &val
}
