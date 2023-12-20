begin;

UPDATE tracks
SET release_date = created_at
WHERE release_date IS NULL;

ALTER TABLE tracks
ALTER COLUMN release_date SET NOT NULL;

commit;