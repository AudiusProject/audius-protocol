package queries

import (
	"context"

	"comms.audius.co/discovery/db"
	"github.com/jmoiron/sqlx"
)

type ChatPermissionsRow struct {
	UserID                   int    `db:"user_id" json:"user_id"`
	Permits                  string `db:"permits" json:"permits"`
	CurrentUserHasPermission bool   `db:"current_user_has_permission" json:"current_user_has_permission"`
}

const bulkGetChatPermissions = `
select
	user_id,
	string_agg(permits, ',') as permits,
	chat_allowed(:CurrentUserID, user_id) as current_user_has_permission
from chat_permissions
where user_id in (:Users)
  and allowed = true
group by user_id;
`

func BulkGetChatPermissions(q db.Queryable, ctx context.Context, currentUserId int32, userIds []int32) ([]ChatPermissionsRow, error) {
	var permissions []ChatPermissionsRow
	argMap := map[string]interface{}{
		"CurrentUserID": currentUserId,
		"Users":         userIds,
	}
	query, args, err := sqlx.Named(bulkGetChatPermissions, argMap)
	if err != nil {
		return permissions, err
	}
	query, args, err = sqlx.In(query, args...)
	if err != nil {
		return permissions, err
	}
	query = q.Rebind(query)
	err = q.SelectContext(ctx, &permissions, query, args...)
	return permissions, err
}
