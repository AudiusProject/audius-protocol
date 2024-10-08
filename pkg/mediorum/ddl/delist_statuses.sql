begin;

-- Define enums
DO $$ BEGIN
    CREATE TYPE delist_entity AS ENUM ('tracks', 'users');
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
		"host" text,
		"entity" delist_entity NOT NULL,
		"created_at" timestamp with time zone NOT NULL
);
ALTER TABLE delist_status_cursor DROP CONSTRAINT IF EXISTS unique_host_entity;
ALTER TABLE delist_status_cursor
ADD CONSTRAINT unique_host_entity UNIQUE (host, entity);

-- Create table to store delist statuses for tracks
CREATE TABLE IF NOT EXISTS track_delist_statuses (
  "createdAt" timestamp with time zone NOT NULL,
  "trackId" integer NOT NULL,
  "ownerId" integer NOT NULL,
  "trackCid" varchar NOT NULL,
  "delisted" boolean NOT NULL,
  "reason" delist_track_reason NOT NULL
);

-- Create table to store delist statuses for users
CREATE TABLE IF NOT EXISTS user_delist_statuses (
  "createdAt" timestamp with time zone NOT NULL,
  "userId" integer NOT NULL,
  "delisted" boolean NOT NULL,
  "reason" delist_user_reason NOT NULL
);

-- Create indexes to look up delist statuses by a track's ID, CID, or owner ID. Also a user's ID
CREATE INDEX IF NOT EXISTS "track_delist_statuses_ownerId_createdAt" ON "track_delist_statuses" USING btree ("ownerId", "createdAt");
CREATE INDEX IF NOT EXISTS "track_delist_statuses_trackId_createdAt" ON "track_delist_statuses" USING btree ("trackId", "createdAt");
CREATE INDEX IF NOT EXISTS "track_delist_statuses_trackCid_createdAt" ON "track_delist_statuses" USING btree ("trackCid", "createdAt");
CREATE INDEX IF NOT EXISTS "user_delist_statuses_userId_createdAt" ON "user_delist_statuses" USING btree ("userId", "createdAt");

commit;
