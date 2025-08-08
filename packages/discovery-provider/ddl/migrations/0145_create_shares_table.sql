begin;

-- Add share_count column to aggregate_track table
ALTER TABLE aggregate_track ADD COLUMN IF NOT EXISTS share_count int DEFAULT 0;

-- Add share_count column to aggregate_playlist table
ALTER TABLE aggregate_playlist ADD COLUMN IF NOT EXISTS share_count int DEFAULT 0;

-- Add track_share_count column to aggregate_user table
ALTER TABLE aggregate_user ADD COLUMN IF NOT EXISTS track_share_count int DEFAULT 0;

-- Create sharetype enum similar to reposttype and savetype
DO $$ BEGIN
    CREATE TYPE public.sharetype AS ENUM (
        'track',
        'playlist'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create shares table following the same pattern as reposts table
CREATE TABLE IF NOT EXISTS public.shares (
    blockhash character varying,
    blocknumber integer,
    user_id integer NOT NULL,
    share_item_id integer NOT NULL,
    share_type public.sharetype NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    txhash character varying NOT NULL DEFAULT ''::character varying,
    slot integer,
    PRIMARY KEY (user_id, share_item_id, share_type, txhash)
);

-- Create indexes following the same pattern as reposts table
CREATE INDEX IF NOT EXISTS shares_item_idx ON public.shares USING btree (share_item_id, share_type, user_id);
CREATE INDEX IF NOT EXISTS shares_new_blocknumber_idx ON public.shares USING btree (blocknumber);
CREATE INDEX IF NOT EXISTS shares_new_created_at_idx ON public.shares USING btree (created_at);
CREATE INDEX IF NOT EXISTS shares_user_idx ON public.shares USING btree (user_id, share_type, share_item_id, created_at);
CREATE INDEX IF NOT EXISTS shares_slot_idx ON public.shares USING btree (slot);

commit;
