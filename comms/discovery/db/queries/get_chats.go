package queries

import (
	"context"
	"database/sql"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/misc"
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

	BlastFromUserID int32 `db:"blast_from_user_id" json:"blast_from_user_id"`
}

// Get a chat's last_message_at
const chatLastMessageAt = `
SELECT last_message_at
FROM chat
WHERE chat_id = $1
`

func ChatLastMessageAt(q db.Queryable, ctx context.Context, chatId string) (time.Time, error) {
	var lastMessageAt time.Time
	err := q.GetContext(ctx, &lastMessageAt, chatLastMessageAt, chatId)
	return lastMessageAt, err
}

// Get a chat with user-specific details
const userChat = `
SELECT
  chat.chat_id,
  chat.created_at,
	chat.last_message,
  chat.last_message_at,
  chat_member.invite_code,
  chat_member.last_active_at,
  chat_member.unread_count,
  chat_member.cleared_history_at
FROM chat_member
JOIN chat ON chat.chat_id = chat_member.chat_id
WHERE chat_member.user_id = $1 AND chat_member.chat_id = $2
`

func UserChat(q db.Queryable, ctx context.Context, arg ChatMembershipParams) (UserChatRow, error) {
	var chat UserChatRow
	err := q.GetContext(ctx, &chat, userChat, arg.UserID, arg.ChatID)
	return chat, err
}

// Get all chats (with user-specific details) for the given user
const userChats = `
SELECT
  chat.chat_id,
  chat.created_at,
  chat.last_message,
  chat.last_message_at,
  chat_member.invite_code,
  chat_member.last_active_at,
  chat_member.unread_count,
  chat_member.cleared_history_at,
  0 as blast_from_user_id
FROM chat_member
JOIN chat ON chat.chat_id = chat_member.chat_id
WHERE chat_member.user_id = $1
  -- AND chat.last_message IS NOT NULL
  AND chat.last_message_at < $2
  AND chat.last_message_at > $3
  AND (
    chat_member.cleared_history_at IS NULL
    OR chat.last_message_at > chat_member.cleared_history_at
  )

union all

SELECT
  'blast_' || b.blast_id       as chat_id, -- will rewrite later
  b.created_at                 as created_at,
  plaintext                    as last_message,
  b.created_at                 as last_message_at,
  ''                           as invite_code,
  b.created_at                 as last_active_at,
  1                            as unread_count,
  null                         as cleared_history_at,
  from_user_id                 as blast_from_user_id

from chat_blast b
where from_user_id in (
  select followee_user_id
  from follows
  where follower_user_id = $1
    and follows.created_at < b.created_at
)

ORDER BY last_message_at DESC, chat_id
`

type UserChatsParams struct {
	UserID int32     `db:"user_id" json:"user_id"`
	Limit  int32     `json:"limit"`
	Before time.Time `json:"before"`
	After  time.Time `json:"after"`
}

func UserChats(q db.Queryable, ctx context.Context, arg UserChatsParams) ([]UserChatRow, error) {
	var items []UserChatRow
	err := q.SelectContext(ctx, &items, userChats, arg.UserID, arg.Before, arg.After)

	var chatIds = map[string]bool{}
	for _, item := range items {
		if item.BlastFromUserID == 0 {
			chatIds[item.ChatID] = true
		}
	}

	var deduped = make([]UserChatRow, 0, len(items))
	for _, item := range items {
		if item.BlastFromUserID > 0 {
			chatId := misc.ChatID(int(arg.UserID), int(item.BlastFromUserID))
			if chatIds[chatId] {
				continue
			}
		}
		deduped = append(deduped, item)
	}
	return deduped, err
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

const unreadChatCount = `
SELECT COUNT(*)
FROM chat_member
WHERE user_id = $1 AND unread_count > 0;
`

func UnreadChatCount(q db.Queryable, ctx context.Context, userId int32) (int, error) {
	var count int
	err := q.GetContext(ctx, &count, unreadChatCount, userId)
	return count, err
}
