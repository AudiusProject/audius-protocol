package queries

import (
	"context"

	"comms.audius.co/db"
)

const getUserIDFromWallet = `
select user_id from users where is_current = TRUE and wallet = LOWER($1)
`

func GetUserIDFromWallet(q db.Queryable, ctx context.Context, walletAddress string) (int32, error) {
	var user_id int32
	err := q.GetContext(ctx, &user_id, getUserIDFromWallet, walletAddress)
	return user_id, err
}
