package queries

import (
	"context"
	"database/sql"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/misc"
)

type BlastRow struct {
	PendingChatID            string         `db:"-" json:"pending_chat_id"`
	BlastID                  string         `db:"blast_id" json:"blast_id"`
	FromUserID               int32          `db:"from_user_id" json:"from_user_id"`
	Audience                 string         `db:"audience" json:"audience"`
	AudienceContentType      sql.NullString `db:"audience_content_type" json:"audience_content_type"`
	AudienceContentID        sql.NullInt32  `db:"audience_content_id" json:"-"`
	AudienceContentIDEncoded sql.NullString `db:"-" json:"audience_content_id"`
	Plaintext                string         `db:"plaintext" json:"plaintext"`
	CreatedAt                time.Time      `db:"created_at" json:"created_at"`
}

func GetNewBlasts(q db.Queryable, ctx context.Context, arg ChatMembershipParams) ([]BlastRow, error) {

	// this query is to find new blasts for the current user
	// which don't already have a eixsting chat.
	// see also: subtly different inverse query exists in chat_blast.go
	// to fan out messages to existing chat
	var findNewBlasts = `
	with
	last_permission_change as (
		select max(t) as t from (
			select updated_at as t from chat_permissions where user_id = $1
			union
			select created_at as t from chat_blocked_users where blocker_user_id = $1
			union
			select to_timestamp(0)
		)
	),
	all_new as (
		select *
		from chat_blast blast
		where
		from_user_id in (
			-- follower_audience
			SELECT followee_user_id AS from_user_id
			FROM follows
			WHERE blast.audience = 'follower_audience'
				AND follows.followee_user_id = blast.from_user_id
				AND follows.follower_user_id = $1
				AND follows.is_delete = false
				AND follows.created_at < blast.created_at
		)
		OR from_user_id in (
			-- tipper_audience
			SELECT receiver_user_id
			FROM user_tips tip
			WHERE blast.audience = 'tipper_audience'
			AND receiver_user_id = blast.from_user_id
			AND sender_user_id = $1
			AND tip.created_at < blast.created_at
		)
		OR from_user_id IN  (
			-- remixer_audience
			SELECT og.owner_id
			FROM tracks t
			JOIN remixes ON remixes.child_track_id = t.track_id
			JOIN tracks og ON remixes.parent_track_id = og.track_id
			WHERE blast.audience = 'remixer_audience'
				AND og.owner_id = blast.from_user_id
				AND t.owner_id = $1
				AND (
					blast.audience_content_id IS NULL
					OR (
						blast.audience_content_type = 'track'
						AND blast.audience_content_id = og.track_id
					)
				)
		)
		OR from_user_id IN (
			-- customer_audience
			SELECT seller_user_id
			FROM usdc_purchases p
			WHERE blast.audience = 'customer_audience'
				AND p.seller_user_id = blast.from_user_id
				AND p.buyer_user_id = $1
				AND (
					audience_content_id IS NULL
					OR (
						blast.audience_content_type = p.content_type::text
						AND blast.audience_content_id = p.content_id
					)
				)
		)
	)
	select * from all_new
	where created_at > (select t from last_permission_change)
	and chat_allowed(from_user_id, $1)
	order by created_at
	`

	var items []BlastRow
	err := q.SelectContext(ctx, &items, findNewBlasts, arg.UserID)
	if err != nil {
		return nil, err
	}

	for idx, blastRow := range items {
		chatId := misc.ChatID(int(arg.UserID), int(blastRow.FromUserID))
		items[idx].PendingChatID = chatId

		if blastRow.AudienceContentID.Valid {
			encoded, _ := misc.EncodeHashId(int(blastRow.AudienceContentID.Int32))
			items[idx].AudienceContentIDEncoded = sql.NullString{
				String: encoded,
				Valid:  true,
			}
		}
	}

	var existingChatIdList []string
	err = q.SelectContext(ctx, &existingChatIdList, `select chat_id from chat_member where user_id = $1`, arg.UserID)
	if err != nil {
		return nil, err
	}

	existingChatIds := map[string]bool{}
	for _, id := range existingChatIdList {
		existingChatIds[id] = true
	}

	// filter out blast rows where chatIds is taken
	filtered := make([]BlastRow, 0, len(items))
	for _, item := range items {
		if existingChatIds[item.PendingChatID] {
			continue
		}
		// allow caller to filter to blasts for a given chat ID
		if arg.ChatID != "" && item.PendingChatID != arg.ChatID {
			continue
		}
		filtered = append(filtered, item)
	}

	return filtered, err

}
