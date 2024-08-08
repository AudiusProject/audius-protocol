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

	// add to existing threads
	// todo: this only works for "follows" target atm
	fanOutSql := `
	with targ as (
		select
			$1 as blast_id,
			followee_user_id as from_user_id,
			follower_user_id as to_user_id,
			member_a.chat_id
		from follows

		-- add to chat where both parties have a chat_member with the same chat_id
		join chat_member member_a on followee_user_id = member_a.user_id
		join chat_member member_b on follower_user_id = member_b.user_id and member_b.chat_id = member_a.chat_id

		where followee_user_id = $2
		  and is_delete = false
	)
	insert into chat_message
		(message_id, chat_id, user_id, created_at, blast_id)
	select
		targ.blast_id || targ.chat_id,
		targ.chat_id,
		targ.from_user_id,
		$3,
		targ.blast_id
	from targ
	on conflict do nothing
	;
	`

	_, err = tx.Exec(fanOutSql, params.BlastID, userId, ts)
	if err != nil {
		return err
	}

	return nil
}

// will need a RPC to upgrade a blast to a dm
