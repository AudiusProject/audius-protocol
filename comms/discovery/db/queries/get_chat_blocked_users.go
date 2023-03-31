package queries

import (
	"context"

	"comms.audius.co/discovery/db"
	"github.com/jmoiron/sqlx"
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

const bulkGetChatBlocksOrReceivedBlocks = `
select blocker_user_id, blockee_user_id from chat_blocked_users where (blocker_user_id = :SenderUserID and blockee_user_id in (:ReceiverUserIDs)) or (blockee_user_id = :SenderUserID and blocker_user_id in (:ReceiverUserIDs))
`

type BulkGetChatBlocksOrReceivedBlocksParams struct {
	SenderUserID    int32   `json:"sender_user_id"`
	ReceiverUserIDs []int32 `json:"receiver_user_ids"`
}

type BulkGetChatBlocksOrReceivedBlocksRow struct {
	BlockerUserID int32 `db:"blocker_user_id" json:"blocker_user_id"`
	BlockeeUserID int32 `db:"blockee_user_id" json:"blockee_user_id"`
}

func BulkGetChatBlocksOrReceivedBlocks(q db.Queryable, ctx context.Context, arg BulkGetChatBlocksOrReceivedBlocksParams) ([]BulkGetChatBlocksOrReceivedBlocksRow, error) {
	var rows []BulkGetChatBlocksOrReceivedBlocksRow
	argMap := map[string]interface{}{
		"SenderUserID":    arg.SenderUserID,
		"ReceiverUserIDs": arg.ReceiverUserIDs,
	}
	query, args, err := sqlx.Named(bulkGetChatBlocksOrReceivedBlocks, argMap)
	if err != nil {
		return rows, err
	}
	query, args, err = sqlx.In(query, args...)
	if err != nil {
		return rows, err
	}
	query = q.Rebind(query)
	err = q.SelectContext(ctx, &rows, query, args...)
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
