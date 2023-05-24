package queries

import (
	"context"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/schema"
	"github.com/jmoiron/sqlx"
)

const getChatPermissions = `
select permits from chat_permissions where user_id = $1
`

func GetChatPermissions(q db.Queryable, ctx context.Context, userId int32) (schema.ChatPermission, error) {
	var permits schema.ChatPermission
	err := q.GetContext(ctx, &permits, getChatPermissions, userId)
	return permits, err
}

type ChatPermissionsRow struct {
	UserID  int32                 `db:"user_id" json:"user_id"`
	Permits schema.ChatPermission `json:"permits"`
}

const bulkGetChatPermissions = `
select user_id, permits from chat_permissions where user_id in (:Users)
`

func BulkGetChatPermissions(q db.Queryable, ctx context.Context, userIds []int32) ([]ChatPermissionsRow, error) {
	var permissions []ChatPermissionsRow
	argMap := map[string]interface{}{
		"Users": userIds,
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
