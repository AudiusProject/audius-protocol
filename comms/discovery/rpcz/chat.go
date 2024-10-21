package rpcz

import (
	"context"
	"time"

	"comms.audius.co/discovery/db/queries"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	"github.com/jmoiron/sqlx"
)

func chatCreate(tx *sqlx.Tx, userId int32, ts time.Time, params schema.ChatCreateRPCParams) error {
	var err error

	// first find any blasts that should seed this chat ...
	var blasts []queries.BlastRow
	for _, invite := range params.Invites {
		invitedUserId, err := misc.DecodeHashId(invite.UserID)
		if err != nil {
			return err
		}

		pending, err := queries.GetNewBlasts(tx, context.Background(), queries.ChatMembershipParams{
			UserID: int32(invitedUserId),
			ChatID: params.ChatID,
		})
		if err != nil {
			return err
		}
		blasts = append(blasts, pending...)
	}

	// it is possible that two conflicting chats get created at the same time
	// in which case there will be two different chat secrets
	// to deterministically resolve this, if there is a conflict
	// we keep the chat with the earliest relayed_at (created_at) timestamp
	_, err = tx.Exec(`
		insert into chat
			(chat_id, created_at, last_message_at)
		values
			($1, $2, $2)
		on conflict (chat_id)
		do update set created_at = $2, last_message_at = $2 where chat.created_at > $2
		`, params.ChatID, ts)
	if err != nil {
		return err
	}

	for _, invite := range params.Invites {

		invitedUserId, err := misc.DecodeHashId(invite.UserID)
		if err != nil {
			return err
		}

		// Update unread count for the invited user. Do not update for the sender of the blast.
		var unreadCount = 0
		for _, blast := range blasts {
			if int(blast.FromUserID) != invitedUserId {
				unreadCount++
			}
		}

		// similar to above... if there is a conflict when creating chat_member records
		// keep the version with the earliest relayed_at (created_at) timestamp.
		_, err = tx.Exec(`
		insert into chat_member
			(chat_id, invited_by_user_id, invite_code, user_id, unread_count, created_at)
		values
			($1, $2, $3, $4, $5, $6)
		on conflict (chat_id, user_id)
		do update set invited_by_user_id=$2, invite_code=$3, unread_count=$5, created_at=$6 where chat_member.created_at > $6`,
			params.ChatID, userId, invite.InviteCode, invitedUserId, unreadCount, ts)
		if err != nil {
			return err
		}

	}

	for _, blast := range blasts {
		_, err = tx.Exec(`
		insert into chat_message
			(message_id, chat_id, user_id, created_at, blast_id)
		values
			($1, $2, $3, $4, $5)
		on conflict do nothing
		`, misc.BlastMessageID(blast.BlastID, params.ChatID), params.ChatID, blast.FromUserID, blast.CreatedAt, blast.BlastID)
		if err != nil {
			return err
		}
	}

	err = chatUpdateLatestFields(tx, params.ChatID)

	return err
}

func chatDelete(tx *sqlx.Tx, userId int32, chatId string, messageTimestamp time.Time) error {
	_, err := tx.Exec("update chat_member set cleared_history_at = $1, last_active_at = $1, unread_count = 0, is_hidden = true where chat_id = $2 and user_id = $3", messageTimestamp, chatId, userId)
	return err
}

func chatUpdateLatestFields(tx *sqlx.Tx, chatId string) error {
	// universal latest message thing
	_, err := tx.Exec(`
	with latest as (
		select
			m.chat_id,
			m.created_at,
			m.ciphertext,
			m.blast_id,
			b.plaintext
		from
			chat_message m
			left join chat_blast b using (blast_id)
		where m.chat_id = $1
		order by m.created_at desc
		limit 1
	)
	update chat c
	set
		last_message_at = latest.created_at,
		last_message = coalesce(latest.ciphertext, latest.plaintext),
		last_message_is_plaintext = latest.blast_id is not null
	from latest
	where c.chat_id = latest.chat_id;
	`, chatId)
	if err != nil {
		return err
	}

	// set chat_member.is_hidden to false
	// if there are any non-blast messages, reactions,
	// or any blasts from the other party after cleared_history_at
	_, err = tx.Exec(`
	UPDATE chat_member member
	SET is_hidden = NOT EXISTS(

		-- Check for chat messages
		SELECT msg.message_id
		FROM chat_message msg
		LEFT JOIN chat_blast b USING (blast_id)
		WHERE msg.chat_id = member.chat_id
		AND (cleared_history_at IS NULL OR msg.created_at > cleared_history_at)
		AND (msg.blast_id IS NULL OR b.from_user_id != member.user_id)

		UNION

		-- Check for chat message reactions
		SELECT r.message_id
		FROM chat_message_reactions r
		LEFT JOIN chat_message msg ON r.message_id = msg.message_id
		WHERE msg.chat_id = member.chat_id
		AND r.user_id != member.user_id
		AND (cleared_history_at IS NULL OR (r.created_at > cleared_history_at AND msg.created_at > cleared_history_at))
	)
	WHERE member.chat_id = $1
	`, chatId)
	return err
}

func chatSendMessage(tx *sqlx.Tx, userId int32, chatId string, messageId string, messageTimestamp time.Time, ciphertext string) error {
	var err error

	_, err = tx.Exec("insert into chat_message (message_id, chat_id, user_id, created_at, ciphertext) values ($1, $2, $3, $4, $5)",
		messageId, chatId, userId, messageTimestamp, ciphertext)
	if err != nil {
		return err
	}

	// update chat's info on last message
	err = chatUpdateLatestFields(tx, chatId)
	if err != nil {
		return err
	}

	// sending a message implicitly marks activity for sender...
	err = chatReadMessages(tx, userId, chatId, messageTimestamp)
	if err != nil {
		return err
	}

	// update counts for non-sender (this could be a stored proc too)
	_, err = tx.Exec("update chat_member set unread_count = unread_count + 1 where chat_id = $1 and user_id != $2 and (last_active_at is null or last_active_at < $3)",
		chatId, userId, messageTimestamp)

	return err
}

func chatReactMessage(tx *sqlx.Tx, userId int32, chatId string, messageId string, reaction *string, messageTimestamp time.Time) error {
	var err error
	if reaction != nil {
		_, err = tx.Exec(`
		insert into chat_message_reactions
			(user_id, message_id, reaction, created_at, updated_at)
		values
			($1, $2, $3, $4, $4)
		on conflict (user_id, message_id)
		do update set reaction = $3, updated_at = $4 where chat_message_reactions.updated_at < $4`,
			userId, messageId, *reaction, messageTimestamp)
	} else {
		_, err = tx.Exec("delete from chat_message_reactions where user_id = $1 and message_id = $2 and updated_at < $3", userId, messageId, messageTimestamp)
	}
	if err != nil {
		return err
	}

	// update chat's info on reaction
	err = chatUpdateLatestFields(tx, chatId)
	return err
}

func chatReadMessages(tx *sqlx.Tx, userId int32, chatId string, readTimestamp time.Time) error {
	_, err := tx.Exec("update chat_member set unread_count = 0, last_active_at = $1 where chat_id = $2 and user_id = $3",
		readTimestamp, chatId, userId)
	return err
}

var permissions = []schema.ChatPermission{
	schema.Followees,
	schema.Followers,
	schema.Tippees,
	schema.Tippers,
	schema.Verified,
}

// Helper function to check if a permit is in the permitList
func isInPermitList(permit schema.ChatPermission, permitList []schema.ChatPermission) bool {
	for _, p := range permitList {
		if p == permit {
			return true
		}
	}
	return false
}

func updatePermissions(tx *sqlx.Tx, userId int32, permit schema.ChatPermission, permitAllowed bool, messageTimestamp time.Time) error {
	_, err := tx.Exec(`
    insert into chat_permissions (user_id, permits, allowed, updated_at)
    values ($1, $2, $3, $4)
    on conflict (user_id, permits)
    do update set allowed = $3 where chat_permissions.updated_at < $4
    `, userId, permit, permitAllowed, messageTimestamp)
	return err
}

func chatSetPermissions(tx *sqlx.Tx, userId int32, permits schema.ChatPermission, permitList []schema.ChatPermission, allow *bool, messageTimestamp time.Time) error {

	// if "all" or "none" or is singular permission style (allow == nil) delete any old rows
	if allow == nil || permits == schema.All || permits == schema.None || isInPermitList(schema.All, permitList) || isInPermitList(schema.None, permitList) {
		_, err := tx.Exec(`
			delete from chat_permissions where user_id = $1 and updated_at < $2
		`, userId, messageTimestamp)
		if err != nil {
			return err
		}
	}

	// old: singular permission style
	if allow == nil {
		// insert
		_, err := tx.Exec(`
		insert into chat_permissions (user_id, permits, updated_at)
		values ($1, $2, $3)
		on conflict do nothing`, userId, permits, messageTimestamp)
		return err
	}

	// Special case for "all" and "none" - no other rows should be inserted
	if isInPermitList(schema.All, permitList) {
		err := updatePermissions(tx, userId, schema.All, true, messageTimestamp)
		return err
	} else if isInPermitList(schema.None, permitList) {
		err := updatePermissions(tx, userId, schema.None, true, messageTimestamp)
		return err
	}

	// new: multiple (checkbox) permission style
	for _, permit := range permissions {
		permitAllowed := isInPermitList(permit, permitList)
		err := updatePermissions(tx, userId, permit, permitAllowed, messageTimestamp)
		if err != nil {
			return err
		}
	}
	return nil
}

func chatBlock(tx *sqlx.Tx, userId int32, blockeeUserId int32, messageTimestamp time.Time) error {
	_, err := tx.Exec("insert into chat_blocked_users (blocker_user_id, blockee_user_id, created_at) values ($1, $2, $3) on conflict do nothing", userId, blockeeUserId, messageTimestamp)
	return err
}

func chatUnblock(tx *sqlx.Tx, userId int32, unblockedUserId int32, messageTimestamp time.Time) error {
	_, err := tx.Exec("delete from chat_blocked_users where blocker_user_id = $1 and blockee_user_id = $2 and created_at < $3", userId, unblockedUserId, messageTimestamp)
	return err
}
