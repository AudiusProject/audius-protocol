package db

import (
	"context"

	"github.com/ClickHouse/clickhouse-go/v2"
)

const ActivityTable = `
create table if not exists activity (
	user_id UInt32,
	action LowCardinality(String),
	object_type LowCardinality(String),
	object_id UInt32,
	created_at DateTime
  )
  ENGINE = MergeTree
  partition by object_type  --  or should it be?   partition by toYYYYMM(created_at)
  order by (user_id);
`

const TrackTable = `
create table if not exists agg_track (
	track_id UInt32,
	play_count UInt32,
	save_count UInt32,
	repost_count UInt32
  )
  ENGINE = MergeTree
  order by (track_id);
`

const AggUserTable = `
create table if not exists agg_user (
	user_id UInt32,
	handle String,
	save_count UInt32,
	repost_count UInt32,
	follower_count UInt32,
	following_count UInt32,
	track_count UInt32,
	playlist_count UInt32,
	listen_count UInt32
  )
  ENGINE = MergeTree
  order by (user_id);`

const FollowsTable = `
create table if not exists follows (
    blocknumber UInt32,
    follower_user_id UInt32,
    followee_user_id UInt32,
    created_at DateTime,
    sign Int8
)
ENGINE = CollapsingMergeTree(sign)
order by (follower_user_id, followee_user_id);
`

const PlaylistsTable = `
create table if not exists playlists (
	playlist_id UInt32,
	playlist_owner_id UInt32,
	playlist_name String,
	playlist_contents String,
	is_album Boolean,
	created_at DateTime, 
	updated_at DateTime,
	last_added_to Nullable(DateTime)
  )
  ENGINE = MergeTree
  order by (playlist_owner_id, created_at);`

const PlaysTable = `
create table if not exists plays (
    id UInt32,
    user_id Nullable(UInt32),
    play_item_id UInt32,
    created_at DateTime, 
    updated_at DateTime
)
ENGINE = MergeTree
partition by toYYYYMM(created_at)
order by (play_item_id);`

const RepostsTable = `
create table if not exists reposts (
    blocknumber UInt32,
    user_id UInt32,
    repost_item_id UInt32,
    repost_type LowCardinality(String),
    created_at DateTime,
    sign Int8
)
ENGINE = CollapsingMergeTree(sign)
order by (user_id, created_at);`

const SavesTable = `
create table if not exists saves (
    blocknumber UInt32,
    user_id UInt32,
    save_item_id UInt32,
    save_type LowCardinality(String),
    created_at DateTime,
    sign Int8
)
ENGINE = CollapsingMergeTree(sign)
order by (user_id, save_type, save_item_id);`

const TracksTable = `
create table if not exists tracks (
    track_id UInt32,
    owner_id UInt32,
    route_id String,
    is_unlisted Boolean,
    title String,
    tags String,
    genre LowCardinality(String),
    mood LowCardinality(String),
    track_segments String,
    created_at DateTime, 
    updated_at DateTime
)
ENGINE = MergeTree
order by (track_id);`

const UserTable = `
create table if not exists users (
    user_id UInt32,
    handle String,
    name String,
    location String,
    creator_node_endpoint String,
    created_at DateTime, 
    updated_at DateTime
)
ENGINE = MergeTree
order by (user_id);`

// TODO: batch this
func InitTables(conn clickhouse.Conn) error {
	ctx := context.Background()
	err := conn.Exec(ctx, ActivityTable)
	if err != nil {
		return err
	}

	err = conn.Exec(ctx, AggUserTable)
	if err != nil {
		return err
	}

	err = conn.Exec(ctx, FollowsTable)
	if err != nil {
		return err
	}

	err = conn.Exec(ctx, PlaylistsTable)
	if err != nil {
		return err
	}

	err = conn.Exec(ctx, PlaysTable)
	if err != nil {
		return err
	}

	err = conn.Exec(ctx, RepostsTable)
	if err != nil {
		return err
	}

	err = conn.Exec(ctx, SavesTable)
	if err != nil {
		return err
	}

	err = conn.Exec(ctx, TracksTable)
	if err != nil {
		return err
	}

	err = conn.Exec(ctx, UserTable)
	if err != nil {
		return err
	}

	// no error happened
	return nil
}
