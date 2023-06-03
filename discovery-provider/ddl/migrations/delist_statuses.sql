-- 5/31/23 poll trusted notifier for delisted statuses
BEGIN;

-- Define enums
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

-- Create table to store delist statuses for users
CREATE TABLE IF NOT EXISTS user_delist_statuses (
  "createdAt" timestamp with time zone NOT NULL,
  "userId" integer NOT NULL,
  "delisted" boolean NOT NULL,
  "reason" delist_user_reason NOT NULL
);

-- Create indexes to look up delist statuses by a user's ID
CREATE INDEX IF NOT EXISTS "user_delist_statuses_userId_createdAt" ON "user_delist_statuses" USING btree ("userId", "createdAt");

COMMIT;
