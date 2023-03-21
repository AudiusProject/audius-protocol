package queries

import (
	"context"

	"comms.audius.co/discovery/db"
)

const getUserIDFromWallet = `
select user_id from users where is_current = TRUE and wallet = LOWER($1)
`

func GetUserIDFromWallet(q db.Queryable, ctx context.Context, walletAddress string) (int32, error) {
	var userId int32
	err := q.GetContext(ctx, &userId, getUserIDFromWallet, walletAddress)
	return userId, err
}
