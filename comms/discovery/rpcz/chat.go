package rpcz

import (
	"time"

	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	"github.com/jmoiron/sqlx"
)

func chatCreate(tx *sqlx.Tx, userId int32, ts time.Time, params schema.ChatCreateRPCParams) error {
	var err error

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
		// invited_by_user_id could also be the other user pubkey
		// this would save client from having to look up pubkey in separate request
		_, err = tx.Exec(`
		insert into chat_member
			(chat_id, invited_by_user_id, invite_code, user_id, created_at)
		values
			($1, $2, $3, $4, $5)
		on conflict (chat_id, user_id)
		do update set invited_by_user_id=$2, invite_code=$3, created_at=$5 where chat_member.created_at > $5`,
			params.ChatID, userId, invite.InviteCode, invitedUserId, ts)
		if err != nil {
			return err
		}
	}

	return err
}

func chatDelete(tx *sqlx.Tx, userId int32, chatId string, messageTimestamp time.Time) error {
	_, err := tx.Exec("update chat_member set cleared_history_at = $1, last_active_at = $1, unread_count = 0 where chat_id = $2 and user_id = $3", messageTimestamp, chatId, userId)
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
	_, err = tx.Exec("update chat set last_message_at = $1, last_message = $2 where chat_id = $3", messageTimestamp, ciphertext, chatId)
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

func chatReactMessage(tx *sqlx.Tx, userId int32, messageId string, reaction *string, messageTimestamp time.Time) error {
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

	return err
}

func chatReadMessages(tx *sqlx.Tx, userId int32, chatId string, readTimestamp time.Time) error {
	_, err := tx.Exec("update chat_member set unread_count = 0, last_active_at = $1 where chat_id = $2 and user_id = $3",
		readTimestamp, chatId, userId)
	return err
}

func chatSetPermissions(tx *sqlx.Tx, userId int32, permit schema.ChatPermission, messageTimestamp time.Time) error {
	_, err := tx.Exec("insert into chat_permissions (user_id, permits, updated_at) values ($1, $2, $3) on conflict (user_id) do update set permits = $2 where chat_permissions.updated_at < $3", userId, permit, messageTimestamp)
	return err
}

func chatBlock(tx *sqlx.Tx, userId int32, blockeeUserId int32, messageTimestamp time.Time) error {
	_, err := tx.Exec("insert into chat_blocked_users (blocker_user_id, blockee_user_id, created_at) values ($1, $2, $3) on conflict do nothing", userId, blockeeUserId, messageTimestamp)
	return err
}

func chatUnblock(tx *sqlx.Tx, userId int32, unblockedUserId int32, messageTimestamp time.Time) error {
	_, err := tx.Exec("delete from chat_blocked_users where blocker_user_id = $1 and blockee_user_id = $2 and created_at < $3", userId, unblockedUserId, messageTimestamp)
	return err
}
