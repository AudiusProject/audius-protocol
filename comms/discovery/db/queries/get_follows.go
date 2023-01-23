package queries

import (
	"context"

	"comms.audius.co/discovery/db"
)

const countFollows = `
select count(*) from follows where follower_user_id = $1 and followee_user_id = $2 and is_current and not is_delete;
`

type CountFollowsParams struct {
	FollowerUserID int32 `db:"follower_user_id" json:"follower_user_id"`
	FolloweeUserID int32 `db:"followee_user_id" json:"followee_user_id"`
}

func CountFollows(q db.Queryable, ctx context.Context, arg CountFollowsParams) (int64, error) {
	var count int64
	err := q.GetContext(ctx, &count, countFollows, arg.FollowerUserID, arg.FolloweeUserID)
	return count, err
}
