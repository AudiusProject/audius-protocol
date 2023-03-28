package queries

import (
	"context"

	"comms.audius.co/discovery/db"
	"github.com/jmoiron/sqlx"
)

const countTips = `
select count(*) from aggregate_user_tips where sender_user_id = $1 and receiver_user_id = $2;
`

type CountTipsParams struct {
	SenderUserID   int32 `db:"sender_user_id" json:"sender_user_id"`
	ReceiverUserID int32 `db:"receiver_user_id" json:"receiver_user_id"`
}

func CountTips(q db.Queryable, ctx context.Context, arg CountTipsParams) (int64, error) {
	var count int64
	err := q.GetContext(ctx, &count, countTips, arg.SenderUserID, arg.ReceiverUserID)
	return count, err
}

const bulkGetTipReceivers = `
select
  sender_user_id,
	receiver_user_id,
	count(*)
from aggregate_user_tips
where 
	sender_user_id = :SenderUserID
  and receiver_user_id in (:ReceiverUserIDs)
group by receiver_user_id, sender_user_id;
`

type BulkGetTipReceiversParams struct {
	ReceiverUserIDs []int32 `json:"receiver_user_ids"`
	SenderUserID    int32   `json:"sender_user_id"`
}

type BulkGetTipReceiversRow struct {
	SenderUserID   int32 `db:"sender_user_id" json:"sender_user_id"`
	ReceiverUserID int32 `db:"receiver_user_id" json:"receiver_user_id"`
	Count          int32 `json:"count"`
}

func BulkGetTipReceivers(q db.Queryable, ctx context.Context, arg BulkGetTipReceiversParams) ([]BulkGetTipReceiversRow, error) {
	var counts []BulkGetTipReceiversRow
	argMap := map[string]interface{}{
		"SenderUserID":    arg.SenderUserID,
		"ReceiverUserIDs": arg.ReceiverUserIDs,
	}
	query, args, err := sqlx.Named(bulkGetTipReceivers, argMap)
	if err != nil {
		return counts, err
	}
	query, args, err = sqlx.In(query, args...)
	if err != nil {
		return counts, err
	}
	query = q.Rebind(query)
	err = q.SelectContext(ctx, &counts, query, args...)
	return counts, err
}
