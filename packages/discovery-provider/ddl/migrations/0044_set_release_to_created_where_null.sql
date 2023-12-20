begin;

lock table tracks in access exclusive mode;

UPDATE tracks
SET release_date = created_at
WHERE release_date IS NULL;

commit;