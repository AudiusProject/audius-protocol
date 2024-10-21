package queries

import (
	"context"

	"comms.audius.co/discovery/db"
	"github.com/jmoiron/sqlx"
)

const bulkGetTipReceivers = `
select
  sender_user_id,
	receiver_user_id
from user_tips
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
}

func BulkGetTipReceivers(q db.Queryable, ctx context.Context, arg BulkGetTipReceiversParams) ([]BulkGetTipReceiversRow, error) {
	var receivers []BulkGetTipReceiversRow
	argMap := map[string]interface{}{
		"SenderUserID":    arg.SenderUserID,
		"ReceiverUserIDs": arg.ReceiverUserIDs,
	}
	query, args, err := sqlx.Named(bulkGetTipReceivers, argMap)
	if err != nil {
		return receivers, err
	}
	query, args, err = sqlx.In(query, args...)
	if err != nil {
		return receivers, err
	}
	query = q.Rebind(query)
	err = q.SelectContext(ctx, &receivers, query, args...)
	return receivers, err
}
