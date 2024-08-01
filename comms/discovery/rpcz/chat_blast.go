package rpcz

import (
	"time"

	"comms.audius.co/discovery/schema"
	"github.com/jmoiron/sqlx"
)

/*
todo:

- maybe blast_id should be computed like: `md5(from_user_id || audience || plaintext)`
- replace now() with ts

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

	// fan out write of chat_message to params.Audience
	// currently just supports followers
	fanOutSql := `
	with targ as (
		select
			$1 as blast_id,
			followee_user_id as from_user_id,
			follower_user_id as to_user_id,

			-- we have to sort the user ids to make the combined id
			case
				when id_encode(followee_user_id) < id_encode(follower_user_id)
				then 'blast_' || id_encode(followee_user_id) || ':' || id_encode(follower_user_id)
				else 'blast_' || id_encode(follower_user_id) || ':' || id_encode(followee_user_id)
			end as chat_id

		from follows
		where followee_user_id = $2
			and is_delete = false
	),


	make_chat as (
		insert into chat
			(chat_id, created_at, last_message_at)
		select
			chat_id, now(), now()
		from targ
		on conflict do nothing
	),

	make_member_to as (
		insert into chat_member
			(chat_id, user_id, invited_by_user_id, unread_count, created_at)
		select
			targ.chat_id, to_user_id, from_user_id, 1, now()
		from targ
		on conflict do nothing
	),

	-- todo: this should be hidden from the sender's ui
	-- or maybe we can skip this row all together
	make_member_from as (
		insert into chat_member
			(chat_id, user_id, invited_by_user_id, unread_count, created_at)
		select
			targ.chat_id, from_user_id, from_user_id, 1, now()
		from targ
		on conflict do nothing
	),

	make_message as (
		insert into chat_message
			(message_id, chat_id, user_id, created_at, blast_id)
		select
			targ.chat_id || ':' || targ.blast_id,
			targ.chat_id,
			targ.from_user_id,
			now(),
			targ.blast_id
		from targ
		on conflict do nothing
	)

	select 'ok'
	;
	`

	_, err = tx.Exec(fanOutSql, params.BlastID, userId)
	if err != nil {
		return err
	}

	/*

		delete from chat where chat_id like 'blast_%';
		delete from chat_member where chat_id like 'blast_%';

	*/

	return nil
}
