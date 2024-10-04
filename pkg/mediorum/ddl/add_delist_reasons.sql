BEGIN;

ALTER TABLE track_delist_statuses ALTER COLUMN reason TYPE VARCHAR(255);

DROP TYPE IF EXISTS delist_track_reason;
CREATE TYPE delist_track_reason AS ENUM (
    'DMCA', 
    'ACR', 
    'MANUAL', 
    'ACR_COUNTER_NOTICE', 
    'DMCA_RETRACTION', 
    'DMCA_COUNTER_NOTICE', 
    'DMCA_AND_ACR_COUNTER_NOTICE'
);

ALTER TABLE track_delist_statuses 
ALTER COLUMN reason TYPE delist_track_reason USING (reason::delist_track_reason);

COMMIT;
