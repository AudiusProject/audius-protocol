package console

import (
	"context"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_openapi/protocol"
)

// walks up the audius chain based on what's stored in
// the database and indexes it into models and views
// that power the console pages
func (c *Console) startIndexer(ctx context.Context) error {
	c.logger.Info("Starting indexer...")
	for {
			select {
			case <-ctx.Done():
					c.logger.Info("Stopping indexer...")
					return ctx.Err()
			default:
					// Simulate work
					time.Sleep(1 * time.Second)

					res, err := c.sdk.ProtocolGetNodeInfo(protocol.NewProtocolGetNodeInfoParams())
					if err != nil {
						c.logger.Errorf("could not get node info: %v", err)
						continue
					}

					payload := res.Payload
					c.logger.Infof("node: %s chain: %s height: %s ", payload.EthAddress, payload.Chainid, payload.CurrentHeight)
			}
	}
}

// polls the connected node for new blocks and inserts them into the database
func (c *Console) indexCoreBlocks(ctx context.Context) error {
	// TODO: get highest block on node
	// TODO: get highest block seen in database
	// TODO: walk as fast as possible from highest block in db to highest block on node
	// TODO: once synced with node then index at 1-2 blocks a second
	// TODO: maybe ask for bulk block queries
	return nil
}

// polls the db for new inserted blocks and spreads out that info to other tables
func (c *Console) indexDBBlocks(ctx context.Context) error {
	return nil
}
