package pubkeystore

import (
	"context"
	"log"
	"time"

	"comms.audius.co/discovery/db"
)

func StartPubkeyBackfill() {
	ctx := context.Background()

	sql := `
	select user_id from users where
	is_current = true
	and user_id > (select coalesce(max(user_id), 0) from user_pubkeys)
	order by user_id asc
	limit 100000;
	`

	for {
		// space it out a bit
		time.Sleep(time.Minute * 5)

		ids := []int{}
		err := db.Conn.Select(&ids, sql)
		if err != nil {
			log.Println("pubkey backfill: select failed", err)
			break
		}
		if len(ids) == 0 {
			log.Println("pubkey backfill: done")
			break
		}
		for _, id := range ids {
			_, err := RecoverUserPublicKeyBase64(ctx, id)
			if err != nil {
				log.Println("pubkey backfill: failed to recover", "user_id", id, "err", err)
			}
		}

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
