package queries

import (
	"context"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/misc"
)

const getUserIDFromWallet = `
select user_id
from users
where is_current = TRUE
  and handle IS NOT NULL
  and is_available = TRUE
  and is_deactivated = FALSE
  and wallet = LOWER($1)
order by user_id asc
`

func GetUserIDFromWallet(q db.Queryable, ctx context.Context, walletAddress string, encodedCurrentUserId string) (int32, error) {
	// attempt to read the (newly added) current_user_id field
	if encodedCurrentUserId != "" {
		if u, err := misc.DecodeHashId(encodedCurrentUserId); err == nil && u > 0 {
			// valid current_user_id + wallet combo?
			// for now just check that the pair exists in the user table
			// in the future this can check a "grants" table that a given operation is permitted
			isValid := false
			db.Conn.QueryRow(`select count(*) > 0 from users where is_current = true and user_id = $1 and wallet = lower($2)`, u, walletAddress).Scan(&isValid)
			if isValid {
				return int32(u), nil
			}
		}
	}

	var userId int32
	err := q.GetContext(ctx, &userId, getUserIDFromWallet, walletAddress)
	return userId, err
}
