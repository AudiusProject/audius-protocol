package chain

import (
	"context"

	"github.com/AudiusProject/audius-protocol/core/db"
)

// returns in current postgres tx for this block
func (c *KVStoreApplication) getDb() *db.Queries {
	return c.queries.WithTx(c.onGoingBlock)
}

func (c *KVStoreApplication) startInProgressTx(ctx context.Context) error {
	dbTx, err := c.pool.Begin(ctx)
	if err != nil {
		return err
	}

	c.onGoingBlock = dbTx
	return nil
}

// commits the current tx that's finished indexing
func (c *KVStoreApplication) commitInProgressTx(ctx context.Context) error {
	if c.onGoingBlock != nil {
		err := c.onGoingBlock.Commit(ctx)
		if err != nil {
			return err
		}
	}
	return nil
}
