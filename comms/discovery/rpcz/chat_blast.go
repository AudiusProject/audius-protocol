package rpcz

import (
	"time"

	"comms.audius.co/discovery/misc"
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
	var audienceContentID *int
	if params.AudienceContentID != nil {
		id, _ := misc.DecodeHashId(*params.AudienceContentID)
		audienceContentID = &id
	}

	// insert params.Message into chat_blast table
	_, err := tx.Exec(`
		insert into chat_blast
			(blast_id, from_user_id, audience, audience_content_type, audience_content_id, plaintext, created_at)
		values
			($1, $2, $3, $4, $5, $6, $7)
		on conflict (blast_id)
		do nothing
		`, params.BlastID, userId, params.Audience, params.AudienceContentType, audienceContentID, params.Message, ts)
	if err != nil {
		return nil, err
	}

	// fan out messages to existing threads
	// see also: similar but subtly different inverse query in `get_new_blasts.go`
	var results []ChatBlastResult

	fanOutSql := `
	WITH blast AS (
		SELECT * FROM chat_blast WHERE blast_id = $1
	),
	aud as (
		-- follower_audience
		SELECT blast_id, follower_user_id AS to_user_id
		FROM follows
		JOIN blast
			ON blast.audience = 'follower_audience'
			AND follows.followee_user_id = blast.from_user_id
			AND follows.is_delete = false
			AND follows.created_at < blast.created_at

		UNION

		-- tipper_audience
		SELECT blast_id, sender_user_id AS to_user_id
		FROM user_tips tip
		JOIN blast
			ON blast.audience = 'tipper_audience'
			AND receiver_user_id = blast.from_user_id
			AND tip.created_at < blast.created_at

		UNION

		-- remixer_audience
		SELECT blast_id, t.owner_id AS to_user_id
		FROM tracks t
		JOIN remixes ON remixes.child_track_id = t.track_id
		JOIN tracks og ON remixes.parent_track_id = og.track_id
		JOIN blast
			ON blast.audience = 'remixer_audience'
			AND og.owner_id = blast.from_user_id
			AND (
				blast.audience_content_id IS NULL
				OR (
					blast.audience_content_type = 'track'
					AND blast.audience_content_id = og.track_id
				)
			)

		UNION

		-- customer_audience
		SELECT blast_id, buyer_user_id AS to_user_id
		FROM usdc_purchases p
		JOIN blast
			ON blast.audience = 'customer_audience'
			AND p.seller_user_id = blast.from_user_id
			AND (
				blast.audience_content_id IS NULL
				OR (
					blast.audience_content_type = p.content_type::text
					AND blast.audience_content_id = p.content_id
				)
			)
	),
	targ AS (
		SELECT
			blast_id,
			from_user_id,
			to_user_id,
		member_b.chat_id
		FROM blast
		JOIN aud USING (blast_id)
		LEFT JOIN chat_member member_a on from_user_id = member_a.user_id
		LEFT JOIN chat_member member_b on to_user_id = member_b.user_id and member_b.chat_id = member_a.chat_id
		WHERE member_b.chat_id IS NOT NULL
	),
	insert_message AS (
		INSERT INTO chat_message
			(message_id, chat_id, user_id, created_at, blast_id)
		SELECT
			blast_id || targ.chat_id,
			targ.chat_id,
			targ.from_user_id,
			$2,
			blast_id
		FROM targ
		ON conflict do nothing
	)
	SELECT chat_id, to_user_id FROM targ;
	`

	err = tx.Select(&results, fanOutSql, params.BlastID, ts.Add(time.Second*-1))
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
