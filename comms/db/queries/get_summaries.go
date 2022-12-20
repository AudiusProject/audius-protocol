package queries

import (
	"context"
	"time"

	"comms.audius.co/db"
)

type SummaryRow struct {
	TotalCount     int64 `json:"total_count"`
	RemainingCount int64 `json:"remaining_count"`
}

const chatMessagesSummary = `
WITH messages AS (
  SELECT
    chat_message.message_id, chat_message.chat_id, chat_message.user_id, chat_message.created_at, chat_message.ciphertext
  FROM chat_message
  JOIN chat_member ON chat_message.chat_id = chat_member.chat_id
  WHERE chat_member.user_id = $1 AND chat_message.chat_id = $2 AND (chat_member.cleared_history_at IS NULL OR chat_message.created_at > chat_member.cleared_history_at)
)
SELECT
  (SELECT COUNT(*) AS total_count FROM messages),
  (SELECT COUNT(*) FROM messages WHERE created_at < $3) AS remaining_count
`

type ChatMessagesSummaryParams struct {
	UserID int32     `db:"user_id" json:"user_id"`
	ChatID string    `db:"chat_id" json:"chat_id"`
	Cursor time.Time `json:"cursor"`
}

func ChatMessagesSummary(q db.Queryable, ctx context.Context, arg ChatMessagesSummaryParams) (SummaryRow, error) {
	var summary SummaryRow
	err := q.GetContext(ctx, &summary, chatMessagesSummary, arg.UserID, arg.ChatID, arg.Cursor)
	return summary, err
}

const userChatsSummary = `
WITH user_chats AS (
  SELECT
    chat.chat_id,
    chat.last_message_at
  FROM chat_member
  JOIN chat ON chat.chat_id = chat_member.chat_id
  WHERE chat_member.user_id = $2 AND (chat_member.cleared_history_at IS NULL OR chat.last_message_at > chat_member.cleared_history_at)
)
SELECT
  (SELECT COUNT(*) AS total_count FROM user_chats),
  (
    SELECT COUNT(*) FROM user_chats
    WHERE last_message_at < $1
  ) AS remaining_count
`

type UserChatsSummaryParams struct {
	Cursor time.Time `json:"cursor"`
	UserID int32     `db:"user_id" json:"user_id"`
}

func UserChatsSummary(q db.Queryable, ctx context.Context, arg UserChatsSummaryParams) (SummaryRow, error) {
	var summary SummaryRow
	err := q.GetContext(ctx, &summary, userChatsSummary, arg.Cursor, arg.UserID)
	return summary, err
}
