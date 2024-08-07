package rpcz

import (
	"time"

	"comms.audius.co/discovery/schema"
	"github.com/jmoiron/sqlx"
)

/*
todo:

- maybe blast_id should be computed like: `md5(from_user_id || audience || plaintext)`

*/

func chatBlast(tx *sqlx.Tx, userId int32, ts time.Time, params schema.ChatBlastRPCParams) error {
	// insert params.Message into messages table
	_, err := tx.Exec(`
		insert into chat_blast
			(blast_id, from_user_id, audience, audience_track_id, plaintext, created_at)
		values
			($1, $2, $3, $4, $5, $6)
		on conflict (blast_id)
		do nothing
		`, params.BlastID, userId, params.Audience, params.AudienceTrackID, params.Message, ts)
	if err != nil {
		return err
	}

	return nil
}

// will need a RPC to upgrade a blast to a dm
