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
// Result struct to hold chat_id and to_user_id
type ChatBlastResult struct {
	ChatID   string `db:"chat_id"`
	ToUserID int32  `db:"to_user_id"`
}

type OutgoingChatMessage struct {
	ToUserId       int32                 `json:"to_user_id"`
	ChatMessageRPC schema.ChatMessageRPC `json:"chat_message_rpc"`
}

func chatBlast(tx *sqlx.Tx, userId int32, ts time.Time, params schema.ChatBlastRPCParams) ([]OutgoingChatMessage, error) {
	// insert params.Message into chat_blast table
	_, err := tx.Exec(`
		insert into chat_blast
			(blast_id, from_user_id, audience, audience_content_type, audience_content_id, plaintext, created_at)
		values
			($1, $2, $3, $4, $5, $6, $7)
		on conflict (blast_id)
		do nothing
		`, params.BlastID, userId, params.Audience, params.AudienceContentType, params.AudienceContentID, params.Message, ts)
	if err != nil {
		return nil, err
	}

	// add to existing threads
	// todo: this only works for "follows" target atm
	var results []ChatBlastResult

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
	),
	insert_message as (
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
	)
	select chat_id, to_user_id from targ;
	;
	`

	err = tx.Select(&results, fanOutSql, params.BlastID, userId, ts)
	if err != nil {
		return nil, err
	}

	// Formulate chat rpc messages for recipients who have an existing chat with sender
	var outgoingMessages []OutgoingChatMessage
	for _, result := range results {
		messageID := result.ChatID + params.BlastID

		outgoingMessages = append(outgoingMessages, OutgoingChatMessage{
			ToUserId: result.ToUserID,
			ChatMessageRPC: schema.ChatMessageRPC{
				Method: schema.MethodChatMessage,
				Params: schema.ChatMessageRPCParams{
					ChatID:      result.ChatID,
					Message:     params.Message,
					MessageID:   messageID,
					IsPlaintext: true,
				}}})

		if err := chatUpdateLatestFields(tx, result.ChatID); err != nil {
			return nil, err
		}
	}

	return outgoingMessages, nil
}
