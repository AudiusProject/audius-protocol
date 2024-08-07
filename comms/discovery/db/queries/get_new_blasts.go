package queries

import (
	"context"
	"database/sql"
	"time"

	"comms.audius.co/discovery/db"
)

type BlastRow struct {
	BlastID         string        `db:"blast_id" json:"chat_id"`
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
	where from_user_id in (
		select followee_user_id
		from follows
		where follower_user_id = $1
			and follows.created_at < b.created_at
			-- and follows.is_delete = false
	)
	`

	var items []BlastRow
	err := q.SelectContext(ctx, &items, stmt, arg.UserID)
	if err != nil {
		return nil, err
	}

	// todo: get existing chat_ids for current user
	//       and filter out any blasts that already have a chat ID

	// for idx, row := range items {
	// 	chatId := misc.ChatID(int(arg.UserID), int(row.FromUserID))
	//
	// }
	// return items, err

	return items, nil
}
