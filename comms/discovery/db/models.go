package db

import (
	"database/sql"
	"time"
)

type ChatBlockedUser struct {
	BlockerUserID int32     `db:"blocker_user_id" json:"blocker_user_id"`
	BlockeeUserID int32     `db:"blockee_user_id" json:"blockee_user_id"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`
}

type ChatMember struct {
	ChatID           string       `db:"chat_id" json:"chat_id"`
	UserID           int32        `db:"user_id" json:"user_id"`
	ClearedHistoryAt sql.NullTime `db:"cleared_history_at" json:"cleared_history_at"`
	InvitedByUserID  int32        `db:"invited_by_user_id" json:"invited_by_user_id"`
	InviteCode       string       `db:"invite_code" json:"invite_code"`
	LastActiveAt     sql.NullTime `db:"last_active_at" json:"last_active_at"`
	UnreadCount      int32        `db:"unread_count" json:"unread_count"`
}

type ChatMessage struct {
	MessageID  string    `db:"message_id" json:"message_id"`
	ChatID     string    `db:"chat_id" json:"chat_id"`
	UserID     int32     `db:"user_id" json:"user_id"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
	Ciphertext string    `db:"ciphertext" json:"ciphertext"`
}
