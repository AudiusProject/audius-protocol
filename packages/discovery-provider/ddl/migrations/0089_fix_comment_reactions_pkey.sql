begin;

ALTER TABLE comment_reactions
DROP CONSTRAINT comment_reactions_pkey;

ALTER TABLE comment_reactions
ADD CONSTRAINT comment_reactions_pkey PRIMARY KEY (comment_id, user_id);

commit;