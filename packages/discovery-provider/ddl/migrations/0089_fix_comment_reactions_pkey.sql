begin;

-- Step 1: Drop the existing primary key constraint
ALTER TABLE comment_reactions
DROP CONSTRAINT comment_reactions_pkey;

-- Step 2: Add a new primary key constraint with both comment_id and user_id
ALTER TABLE comment_reactions
ADD CONSTRAINT comment_reactions_pkey PRIMARY KEY (comment_id, user_id);

commit;