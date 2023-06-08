BEGIN;

-- Define enums
DO $$ BEGIN
    CREATE TYPE delist_entity AS ENUM ('TRACKS', 'USERS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delist_track_reason AS ENUM ('DMCA', 'ACR', 'MANUAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delist_user_reason AS ENUM ('STRIKE_THRESHOLD', 'COPYRIGHT_SCHOOL', 'MANUAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create table to maintain a cursor to the most recent delist status pulled from the host (the only host is trusted notifier)
CREATE TABLE IF NOT EXISTS delist_status_cursor (
		host text,
		entity delist_entity NOT NULL,
		created_at timestamp with time zone NOT NULL,
    PRIMARY KEY(host, entity)
);

-- Create table to store delist statuses for tracks
CREATE TABLE IF NOT EXISTS track_delist_statuses (
  created_at timestamp with time zone NOT NULL,
  track_id integer NOT NULL,
  owner_id integer NOT NULL,
  track_cid varchar NOT NULL,
  delisted boolean NOT NULL,
  reason delist_track_reason NOT NULL,
  PRIMARY KEY(created_at, track_id, delisted)
);

-- Create table to store delist statuses for users
CREATE TABLE IF NOT EXISTS user_delist_statuses (
  created_at timestamp with time zone NOT NULL,
  user_id integer NOT NULL,
  delisted boolean NOT NULL,
  reason delist_user_reason NOT NULL,
  PRIMARY KEY(created_at, user_id, delisted)
);

-- Create indexes to look up delist statuses by a track's ID, CID, or owner ID. Also a user's ID
CREATE INDEX IF NOT EXISTS track_delist_statuses_owner_id_created_at ON track_delist_statuses USING btree (owner_id, created_at);
CREATE INDEX IF NOT EXISTS track_delist_statuses_track_cid_created_at ON track_delist_statuses USING btree (track_cid, created_at);

COMMIT;
