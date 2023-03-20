package queries

import (
	"context"

	"comms.audius.co/discovery/db"
	"github.com/jmoiron/sqlx"
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

const bulkGetFollowers = `
select
  follower_user_id,
	followee_user_id,
	count(*)
from follows
where 
	followee_user_id = :FolloweeUserID
  and follower_user_id in (:FollowerUserIDs)
	and is_current
	and not is_delete
group by follower_user_id, followee_user_id;
`

type BulkGetFollowersParams struct {
	FollowerUserIDs []int32 `json:"follower_user_ids"`
	FolloweeUserID  int32   `json:"followee_user_id"`
}

type BulkGetFollowersRow struct {
	FollowerUserID int32 `db:"follower_user_id" json:"follower_user_id"`
	FolloweeUserID int32 `db:"followee_user_id" json:"followee_user_id"`
	Count          int32 `json:"count"`
}

func BulkGetFollowers(q db.Queryable, ctx context.Context, arg BulkGetFollowersParams) ([]BulkGetFollowersRow, error) {
	var counts []BulkGetFollowersRow
	argMap := map[string]interface{}{
		"FollowerUserIDs": arg.FollowerUserIDs,
		"FolloweeUserID":  arg.FolloweeUserID,
	}
	query, args, err := sqlx.Named(bulkGetFollowers, argMap)
	if err != nil {
		return counts, err
	}
	query, args, err = sqlx.In(query, args...)
	if err != nil {
		return counts, err
	}
	query = q.Rebind(query)
	err = q.GetContext(ctx, &counts, query, args...)
	return counts, err
}
