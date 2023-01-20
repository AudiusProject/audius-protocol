package queries

import (
	"context"

	"comms.audius.co/discovery/db"
)

const countTips = `
select count(*) from user_tips where sender_user_id = $1 and receiver_user_id = $2;
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
