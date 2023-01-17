package queries

import (
	"context"
	"database/sql"
	"time"

	"comms.audius.co/db"
	"github.com/jmoiron/sqlx"
)

type UserChatRow struct {
	ChatID           string         `db:"chat_id" json:"chat_id"`
	CreatedAt        time.Time      `db:"created_at" json:"created_at"`
	LastMessage      sql.NullString `db:"last_message" json:"last_message"`
	LastMessageAt    time.Time      `db:"last_message_at" json:"last_message_at"`
	InviteCode       string         `db:"invite_code" json:"invite_code"`
	LastActiveAt     sql.NullTime   `db:"last_active_at" json:"last_active_at"`
	UnreadCount      int32          `db:"unread_count" json:"unread_count"`
	ClearedHistoryAt sql.NullTime   `db:"cleared_history_at" json:"cleared_history_at"`
}

// Get a chat with user-specific details
const userChat = `
WITH last_message AS (
	SELECT ciphertext, chat_id
	FROM chat_message
	WHERE chat_id = $2
	ORDER BY created_at DESC, message_id
	LIMIT 1
)
SELECT
  chat.chat_id,
  chat.created_at, 
	last_message.ciphertext AS last_message,
  chat.last_message_at,
  chat_member.invite_code,
  chat_member.last_active_at,
  chat_member.unread_count,
  chat_member.cleared_history_at
FROM chat_member
JOIN chat ON chat.chat_id = chat_member.chat_id
LEFT JOIN last_message ON last_message.chat_id = chat_member.chat_id
WHERE chat_member.user_id = $1 AND chat_member.chat_id = $2
`

func UserChat(q db.Queryable, ctx context.Context, arg ChatMembershipParams) (UserChatRow, error) {
	var chat UserChatRow
	err := q.GetContext(ctx, &chat, userChat, arg.UserID, arg.ChatID)
	return chat, err
}

// Get all chats (with user-specific details) for the given user
const userChats = `
WITH last_message_per_chat AS (
	SELECT ciphertext, chat_id
	FROM (
		SELECT RANK() OVER (PARTITION BY chat_message.chat_id ORDER BY chat_message.created_at DESC, chat_message.message_id) AS chat_rank,
		chat_message.ciphertext,
		chat_message.chat_id
		FROM chat_message
		JOIN chat_member on chat_member.chat_id = chat_message.chat_id
		WHERE chat_member.user_id = $1
	) ranked_message
	WHERE chat_rank = 1
)
SELECT
  chat.chat_id,
  chat.created_at, 
	last_message_per_chat.ciphertext AS last_message,
  chat.last_message_at,
  chat_member.invite_code,
  chat_member.last_active_at,
  chat_member.unread_count,
  chat_member.cleared_history_at
FROM chat_member
JOIN chat ON chat.chat_id = chat_member.chat_id
LEFT JOIN last_message_per_chat ON last_message_per_chat.chat_id = chat_member.chat_id
WHERE chat_member.user_id = $1
	AND chat.last_message_at < $3
	AND chat.last_message_at > $4
  AND (chat_member.cleared_history_at IS NULL
	  OR chat.last_message_at > chat_member.cleared_history_at)
ORDER BY chat.last_message_at DESC, chat.chat_id
LIMIT $2
`

type UserChatsParams struct {
	UserID int32     `db:"user_id" json:"user_id"`
	Limit  int32     `json:"limit"`
	Before time.Time `json:"before"`
	After  time.Time `json:"after"`
}

func UserChats(q db.Queryable, ctx context.Context, arg UserChatsParams) ([]UserChatRow, error) {
	var items []UserChatRow
	err := q.SelectContext(ctx, &items, userChats, arg.UserID, arg.Limit, arg.Before, arg.After)
	return items, err
}

const maxNumNewChatsSince = `
WITH counts AS (
	SELECT COUNT(*) AS count
	FROM chat
	JOIN chat_member on chat.chat_id = chat_member.chat_id
	WHERE chat_member.user_id IN (:Users) AND chat.created_at > :Cursor
	GROUP BY chat_member.user_id
)
SELECT COALESCE(MAX(count), 0) FROM counts;
`

type MaxNumNewChatsSinceParams struct {
	Users  []int32   `json:"user_id"`
	Cursor time.Time `json:"cursor"`
}

// Return the max number of new chats since CURSOR out of the given USERS
func MaxNumNewChatsSince(q db.Queryable, ctx context.Context, arg MaxNumNewChatsSinceParams) (int, error) {
	var count int
	argMap := map[string]interface{}{
		"Users":  arg.Users,
		"Cursor": arg.Cursor,
	}
	query, args, err := sqlx.Named(maxNumNewChatsSince, argMap)
	if err != nil {
		return count, err
	}
	query, args, err = sqlx.In(query, args...)
	if err != nil {
		return count, err
	}
	query = q.Rebind(query)
	err = q.GetContext(ctx, &count, query, args...)
	return count, err
}
