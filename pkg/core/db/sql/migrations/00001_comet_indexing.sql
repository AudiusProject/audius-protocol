/*
  This file defines the database schema for the PostgresQL ("psql") event sink
  implementation in CometBFT. The operator must create a database and install
  this schema before using the database to index events.

  https://github.com/cometbft/cometbft/blob/main/state/indexer/sink/psql/schema.sql
 */

-- +migrate Up

-- The core_blocks table records metadata about each block.
-- The block record does not include its events or transactions (see core_tx_results).
CREATE TABLE IF NOT EXISTS core_blocks (
  rowid      BIGSERIAL PRIMARY KEY,

  height     BIGINT NOT NULL,
  chain_id   VARCHAR NOT NULL,

  -- When this block header was logged into the sink, in UTC.
  created_at TIMESTAMPTZ NOT NULL,

  UNIQUE (height, chain_id)
);

-- Index core_blocks by height and chain, since we need to resolve block IDs when
-- indexing transaction records and transaction events.
CREATE INDEX IF NOT EXISTS idx_core_blocks_height_chain ON core_blocks(height, chain_id);

-- The core_tx_results table records metadata about transaction results.  Note that
-- the events from a transaction are stored separately.
CREATE TABLE IF NOT EXISTS core_tx_results (
  rowid BIGSERIAL PRIMARY KEY,

  -- The block to which this transaction belongs.
  block_id BIGINT NOT NULL REFERENCES core_blocks(rowid),
  -- The sequential index of the transaction within the block.
  index INTEGER NOT NULL,
  -- When this result record was logged into the sink, in UTC.
  created_at TIMESTAMPTZ NOT NULL,
  -- The hex-encoded hash of the transaction.
  tx_hash VARCHAR NOT NULL,
  -- The protobuf wire encoding of the TxResult message.
  tx_result BYTEA NOT NULL,

  UNIQUE (block_id, index)
);

-- The core_events table records events. All events (both block and transaction) are
-- associated with a block ID; transaction events also have a transaction ID.
CREATE TABLE IF NOT EXISTS core_events (
  rowid BIGSERIAL PRIMARY KEY,

  -- The block and transaction this event belongs to.
  -- If tx_id is NULL, this is a block event.
  block_id BIGINT NOT NULL REFERENCES core_blocks(rowid),
  tx_id    BIGINT NULL REFERENCES core_tx_results(rowid),

  -- The application-defined type label for the event.
  type VARCHAR NOT NULL
);

-- The core_attributes table records event attributes.
CREATE TABLE IF NOT EXISTS core_attributes (
   event_id      BIGINT NOT NULL REFERENCES core_events(rowid),
   key           VARCHAR NOT NULL, -- bare key
   composite_key VARCHAR NOT NULL, -- composed type.key
   value         VARCHAR NULL,

   UNIQUE (event_id, key)
);

-- A joined view of core_events and their core_attributes. Events that do not have any
-- core_attributes are represented as a single row with empty key and value fields.
CREATE VIEW event_attributes AS
  SELECT block_id, tx_id, type, key, composite_key, value
  FROM core_events LEFT JOIN core_attributes ON (core_events.rowid = core_attributes.event_id);

-- A joined view of all block events (those having tx_id NULL).
CREATE VIEW block_events AS
  SELECT core_blocks.rowid as block_id, height, chain_id, type, key, composite_key, value
  FROM core_blocks JOIN event_attributes ON (core_blocks.rowid = event_attributes.block_id)
  WHERE event_attributes.tx_id IS NULL;

-- A joined view of all transaction events.
CREATE VIEW tx_events AS
  SELECT height, index, chain_id, type, key, composite_key, value, core_tx_results.created_at
  FROM core_blocks JOIN core_tx_results ON (core_blocks.rowid = core_tx_results.block_id)
  JOIN event_attributes ON (core_tx_results.rowid = event_attributes.tx_id)
  WHERE event_attributes.tx_id IS NOT NULL;

-- +migrate Down
drop index if exists idx_core_blocks_height_chain;
drop view if exists block_events;
drop view if exists tx_events;
drop view if exists event_attributes;
drop table if exists core_attributes;
drop table if exists core_events;
drop table if exists core_tx_results;
drop table if exists core_blocks;
