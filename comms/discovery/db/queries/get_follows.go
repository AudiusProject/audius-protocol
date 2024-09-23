package queries

import (
	"context"

	"comms.audius.co/discovery/db"
	"github.com/jmoiron/sqlx"
)

const bulkGetFollowers = `
select
  follower_user_id,
	followee_user_id
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
}

func BulkGetFollowers(q db.Queryable, ctx context.Context, arg BulkGetFollowersParams) ([]BulkGetFollowersRow, error) {
	var followers []BulkGetFollowersRow
	argMap := map[string]interface{}{
		"FollowerUserIDs": arg.FollowerUserIDs,
		"FolloweeUserID":  arg.FolloweeUserID,
	}
	query, args, err := sqlx.Named(bulkGetFollowers, argMap)
	if err != nil {
		return followers, err
	}
	query, args, err = sqlx.In(query, args...)
	if err != nil {
		return followers, err
	}
	query = q.Rebind(query)
	err = q.SelectContext(ctx, &followers, query, args...)
	return followers, err
}
