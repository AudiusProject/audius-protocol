package queries

import (
	"context"
	"database/sql"

	"comms.audius.co/discovery/db"
)

type ChatMembershipParams struct {
	UserID int32  `db:"user_id" json:"user_id"`
	ChatID string `db:"chat_id" json:"chat_id"`
}

// Get a user's chat membership
const chatMembership = `
select chat_id, user_id, cleared_history_at, invited_by_user_id, invite_code, last_active_at, unread_count from chat_member where user_id = $1 and chat_id = $2
`

func ChatMembership(q db.Queryable, ctx context.Context, arg ChatMembershipParams) (db.ChatMember, error) {
	var member db.ChatMember
	err := q.GetContext(ctx, &member, chatMembership, arg.UserID, arg.ChatID)
	return member, err
}

// Get all memberships in a chat
const chatMembers = `
select chat_id, user_id, cleared_history_at, invited_by_user_id, invite_code, last_active_at, unread_count from chat_member where chat_id = $1
`

func ChatMembers(q db.Queryable, ctx context.Context, chatID string) ([]db.ChatMember, error) {
	var members []db.ChatMember
	err := q.SelectContext(ctx, &members, chatMembers, chatID)
	return members, err
}

// Get a user's last_active_at timestamp in a chat
const lastActiveAt = `
select last_active_at from chat_member where chat_id = $1 and user_id = $2
`

func LastActiveAt(q db.Queryable, ctx context.Context, arg ChatMembershipParams) (sql.NullTime, error) {
	var activeAt sql.NullTime
	err := q.GetContext(ctx, &activeAt, lastActiveAt, arg.ChatID, arg.UserID)
	return activeAt, err
}
