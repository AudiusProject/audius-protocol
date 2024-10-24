begin;

ALTER TABLE comments DROP COLUMN is_pinned;

ALTER TABLE tracks ADD COLUMN pinned_comment_id INTEGER;

commit;