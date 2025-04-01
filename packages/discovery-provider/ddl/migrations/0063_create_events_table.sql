begin;

-- Create enums for event type and event entity type
DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('remix_contest', 'live_event', 'new_release');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_entity_type AS ENUM ('track', 'collection', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS events (
    event_id INTEGER PRIMARY KEY,
    event_type event_type NOT NULL,
    user_id INTEGER NOT NULL,
    entity_type event_entity_type DEFAULT NULL,
    entity_id INTEGER DEFAULT NULL,
    end_date TIMESTAMP DEFAULT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    event_data JSONB DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    txhash TEXT NOT NULL,
    blockhash TEXT NOT NULL,
    blocknumber integer REFERENCES blocks(number)
);

-- Add index for event type, entity type, entity id, created at, and end date for efficient lookups
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events USING btree (event_type);
CREATE INDEX IF NOT EXISTS idx_events_entity_type ON public.events USING btree (entity_type);
CREATE INDEX IF NOT EXISTS idx_events_entity_id ON public.events USING btree (entity_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON public.events USING btree (end_date);

commit; 