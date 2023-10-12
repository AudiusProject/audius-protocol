BEGIN;

DO $$ BEGIN
    ALTER TYPE delist_track_reason ADD VALUE IF NOT EXISTS 'ACR_COUNTER_NOTICE';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE delist_track_reason ADD VALUE IF NOT EXISTS 'DMCA_RETRACTION';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE delist_track_reason ADD VALUE IF NOT EXISTS 'DMCA_COUNTER_NOTICE';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE delist_track_reason ADD VALUE IF NOT EXISTS 'DMCA_AND_ACR_COUNTER_NOTICE';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMIT;
