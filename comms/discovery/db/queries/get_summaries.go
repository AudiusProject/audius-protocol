package queries

import (
	"context"
	"time"

	"comms.audius.co/discovery/db"
)

type SummaryRow struct {
	TotalCount  int64 `db:"total_count" json:"total_count"`
	BeforeCount int64 `db:"before_count" json:"before_count"`
	AfterCount  int64 `db:"after_count" json:"after_count"`
}

const chatMessagesSummary = `
WITH messages AS (
  SELECT
    chat_message.message_id, chat_message.created_at
  FROM chat_message
  JOIN chat_member ON chat_message.chat_id = chat_member.chat_id
  WHERE chat_member.user_id = $1 
  AND chat_message.chat_id = $2 
  AND (chat_member.cleared_history_at IS NULL 
    OR chat_message.created_at > chat_member.cleared_history_at)
)
SELECT
  (SELECT COUNT(*) AS total_count FROM messages),
  (SELECT COUNT(*) FROM messages WHERE created_at < $3) AS before_count,
  (SELECT COUNT(*) FROM messages WHERE created_at > $4) AS after_count
`

type ChatMessagesSummaryParams struct {
	UserID int32     `db:"user_id" json:"user_id"`
	ChatID string    `db:"chat_id" json:"chat_id"`
	Before time.Time `json:"before"`
	After  time.Time `json:"after"`
}

func ChatMessagesSummary(q db.Queryable, ctx context.Context, arg ChatMessagesSummaryParams) (SummaryRow, error) {
	var summary SummaryRow
	err := q.GetContext(ctx, &summary, chatMessagesSummary, arg.UserID, arg.ChatID, arg.Before, arg.After)
	return summary, err
}

const userChatsSummary = `
WITH user_chats AS (
  SELECT
    chat.chat_id,
    chat.last_message_at
  FROM chat_member
  JOIN chat ON chat.chat_id = chat_member.chat_id
  WHERE chat_member.user_id = $1
	  AND (chat_member.cleared_history_at IS NULL
		  OR chat.last_message_at > chat_member.cleared_history_at)
)
SELECT
  (SELECT COUNT(*) AS total_count FROM user_chats),
  (
    SELECT COUNT(*) FROM user_chats
    WHERE last_message_at < $2
  ) AS before_count,
	(
	  SELECT COUNT(*) FROM user_chats
		WHERE last_message_at > $3
	) AS after_count
`

type UserChatsSummaryParams struct {
	UserID int32     `db:"user_id" json:"user_id"`
	Before time.Time `json:"before"`
	After  time.Time `json:"after"`
}

func UserChatsSummary(q db.Queryable, ctx context.Context, arg UserChatsSummaryParams) (SummaryRow, error) {
	var summary SummaryRow
	err := q.GetContext(ctx, &summary, userChatsSummary, arg.UserID, arg.Before, arg.After)
	return summary, err
}
