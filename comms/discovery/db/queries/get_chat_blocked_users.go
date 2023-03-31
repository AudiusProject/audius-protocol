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

const countChatBlocks = `
select count(*) from chat_blocked_users where (blocker_user_id = $1 and blockee_user_id = $2) or (blocker_user_id = $2 and blockee_user_id = $1)
`

type CountChatBlocksParams struct {
	User1 int32 `json:"user_1"`
	User2 int32 `json:"user_2"`
}

func CountChatBlocks(q db.Queryable, ctx context.Context, arg CountChatBlocksParams) (int64, error) {
	var count int64
	err := q.GetContext(ctx, &count, countChatBlocks, arg.User1, arg.User2)
	return count, err
}

const getChatBlocksOrReceivedBlocks = `
select blocker_user_id, blockee_user_id from chat_blocked_users where blocker_user_id = $1 or blockee_user_id = $1
`

type GetChatBlocksOrReceivedBlocksRow struct {
	BlockerUserID int32 `db:"blocker_user_id" json:"blocker_user_id"`
	BlockeeUserID int32 `db:"blockee_user_id" json:"blockee_user_id"`
}

func GetChatBlocksOrReceivedBlocks(q db.Queryable, ctx context.Context, userId int32) ([]GetChatBlocksOrReceivedBlocksRow, error) {
	var rows []GetChatBlocksOrReceivedBlocksRow
	err := q.SelectContext(ctx, &rows, getChatBlocksOrReceivedBlocks, userId)
	return rows, err
}

const getChatBlockedUsers = `
select blockee_user_id from chat_blocked_users where blocker_user_id = $1;
`

func GetChatBlockedUsers(q db.Queryable, ctx context.Context, blockerUserId int32) ([]int32, error) {
	var blockedUsers []int32
	err := q.SelectContext(ctx, &blockedUsers, getChatBlockedUsers, blockerUserId)
	return blockedUsers, err
}
