package queries

import (
	"context"
	"database/sql"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/misc"
)

type BlastRow struct {
	PendingChatID   string        `db:"-" json:"pending_chat_id"`
	BlastID         string        `db:"blast_id" json:"blast_id"`
	FromUserID      int32         `db:"from_user_id" json:"from_user_id"`
	Audience        string        `db:"audience" json:"audience"`
	AudienceTrackID sql.NullInt32 `db:"audience_track_id" json:"audience_track_id"`
	Plaintext       string        `db:"plaintext" json:"plaintext"`
	CreatedAt       time.Time     `db:"created_at" json:"created_at"`
}

func GetNewBlasts(q db.Queryable, ctx context.Context, arg ChatMembershipParams) ([]BlastRow, error) {

	var stmt = `
	select *
	from chat_blast b
	where
	from_user_id in (
		select followee_user_id
		from follows
		where follower_user_id = $1
			and follows.created_at < b.created_at
			and follows.is_delete = false
	)
	order by created_at
	`

	var items []BlastRow
	err := q.SelectContext(ctx, &items, stmt, arg.UserID)
	if err != nil {
		return nil, err
	}

	for idx, row := range items {
		chatId := misc.ChatID(int(arg.UserID), int(row.FromUserID))
		items[idx].PendingChatID = chatId
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
