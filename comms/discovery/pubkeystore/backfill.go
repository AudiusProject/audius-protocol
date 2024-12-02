package pubkeystore

import (
	"context"
	"time"

	"comms.audius.co/discovery/db"
	"golang.org/x/exp/slog"
)

func StartPubkeyBackfill() {
	ctx := context.Background()

	sql := `
	select user_id
	from users
	where not exists (select 1 from user_pubkeys p where users.user_id = p.user_id);
	`

	for {
		// space it out a bit
		time.Sleep(time.Minute * 2)

		ids := []int{}
		err := db.Conn.Select(&ids, sql)
		if err != nil {
			break
		}
		for _, id := range ids {
			_, err := RecoverUserPublicKeyBase64(ctx, id)
			if err != nil {
				slog.Debug("pubkey backfill: failed to recover", "user_id", id, "err", err)
			}
		}

		time.Sleep(time.Minute * 8)

	}

}

func getPubkey(userId int) (string, error) {
	var pk string
	err := db.Conn.Get(&pk, `select pubkey_base64 from user_pubkeys where user_id = $1`, userId)
	return pk, err
}

func setPubkey(userId int, pubkeyBase64 string) error {
	_, err := db.Conn.Exec(`insert into user_pubkeys values ($1, $2) on conflict do nothing`, userId, pubkeyBase64)
	return err
}
