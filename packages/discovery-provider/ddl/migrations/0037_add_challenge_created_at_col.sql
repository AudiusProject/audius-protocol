begin;

ALTER TABLE
    user_challenges
ADD
    COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

commit;
