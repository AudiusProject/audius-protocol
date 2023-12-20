begin;

UPDATE tracks
SET release_date = created_at
WHERE release_date IS NULL;

commit;