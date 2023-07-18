package rpcz

import (
	"time"

	"github.com/jmoiron/sqlx"
)

func upsertUserBan(tx *sqlx.Tx, userId string, isBanned bool, ts time.Time) error {
	banUpsertSql := `
	insert into chat_ban
		(user_id, is_banned, updated_at)
	values
		($1, $2, $3)
	on conflict (user_id) do update
	set is_banned = $2, updated_at = $3
	where chat_ban.updated_at < $3
	`

	_, err := tx.Exec(banUpsertSql, userId, isBanned, ts)
	return err
}
