
begin;

ALTER TABLE comment_reports DROP CONSTRAINT comment_reports_pkey;

ALTER TABLE comment_reports
ADD CONSTRAINT comment_reports_pkey PRIMARY KEY (comment_id, user_id);

commit;