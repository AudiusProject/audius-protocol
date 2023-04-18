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

const bulkGetChatBlockedOrBlocking = `
select blocker_user_id, blockee_user_id from chat_blocked_users where (blocker_user_id = :SenderUserID and blockee_user_id in (:ReceiverUserIDs)) or (blockee_user_id = :SenderUserID and blocker_user_id in (:ReceiverUserIDs))
`

type BulkGetChatBlockedOrBlockingParams struct {
	SenderUserID    int32   `json:"sender_user_id"`
	ReceiverUserIDs []int32 `json:"receiver_user_ids"`
}

type BulkGetChatBlockedOrBlockingRow struct {
	BlockerUserID int32 `db:"blocker_user_id" json:"blocker_user_id"`
	BlockeeUserID int32 `db:"blockee_user_id" json:"blockee_user_id"`
}

func BulkGetChatBlockedOrBlocking(q db.Queryable, ctx context.Context, arg BulkGetChatBlockedOrBlockingParams) ([]BulkGetChatBlockedOrBlockingRow, error) {
	var rows []BulkGetChatBlockedOrBlockingRow
	argMap := map[string]interface{}{
		"SenderUserID":    arg.SenderUserID,
		"ReceiverUserIDs": arg.ReceiverUserIDs,
	}
	query, args, err := sqlx.Named(bulkGetChatBlockedOrBlocking, argMap)
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
