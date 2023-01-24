package queries

import (
	"context"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/schema"
)

const getChatPermissions = `
select permits from chat_permissions where user_id = $1
`

func GetChatPermissions(q db.Queryable, ctx context.Context, userId int32) (schema.ChatPermission, error) {
	var permits schema.ChatPermission
	err := q.GetContext(ctx, &permits, getChatPermissions, userId)
	return permits, err
}
