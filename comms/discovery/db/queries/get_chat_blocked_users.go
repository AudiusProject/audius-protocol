package queries

import (
	"context"

	"comms.audius.co/discovery/db"
)

const chatBlock = `
select * from chat_blocked_users where blocker_user_id = $1 and blockee_user_id = $2
`

type ChatBlockParams struct {
	BlockerUserID int32 `db:"blocker_user_id" json:"blocker_user_id"`
	BlockeeUserID int32 `db:"blockee_user_id" json:"blockee_user_id"`
}

func ChatBlock(q db.Queryable, ctx context.Context, arg ChatBlockParams) (db.ChatBlockedUser, error) {
	var block db.ChatBlockedUser
	err := q.GetContext(ctx, &block, chatBlock, arg.BlockerUserID, arg.BlockeeUserID)
	return block, err
}

const getChatBlockees = `
select blockee_user_id from chat_blocked_users where blocker_user_id = $1;
`

func GetChatBlockees(q db.Queryable, ctx context.Context, userId int32) ([]int32, error) {
	var blockees []int32
	err := q.SelectContext(ctx, &blockees, getChatBlockees, userId)
	return blockees, err
}

const getChatBlockers = `
select blocker_user_id from chat_blocked_users where blockee_user_id = $1;
`

func GetChatBlockers(q db.Queryable, ctx context.Context, userId int32) ([]int32, error) {
	var blockers []int32
	err := q.SelectContext(ctx, &blockers, getChatBlockers, userId)
	return blockers, err
}
