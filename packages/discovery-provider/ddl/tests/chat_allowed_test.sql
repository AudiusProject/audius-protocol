begin; do $$
declare
    agg_user aggregate_user%rowtype := null;
    agg_track aggregate_track%rowtype := null;

begin

ASSERT (SELECT chat_allowed(1,2) = TRUE);
insert into chat_blocked_users values (2, 1, now());
ASSERT (SELECT chat_allowed(1,2) = FALSE);


-- create a pre-existing chat for USER 10 + USER 11
insert into chat (chat_id, created_at, last_message_at) values ('preexisting', now(), now());

insert into chat_member
  (chat_id, user_id, invited_by_user_id, invite_code, created_at)
values
  ('preexisting', 10, 10, '', now()),
  ('preexisting', 11, 10, '', now());

insert into chat_message
  (message_id, chat_id, user_id, created_at)
values
  ('first', 'preexisting', 11, now());

-- USER 10 allows followers
insert into chat_permissions values (10, 'followers', now());
ASSERT (SELECT chat_allowed(1,10) = FALSE);

-- USER 2 follows + can message
insert into follows
  (follower_user_id, followee_user_id, is_current, is_delete, created_at)
values
  (2, 10, true, false, now());
ASSERT (SELECT chat_allowed(2,10) = TRUE);

-- USER 10 + 11 had preexisting chat, so can still chat after 10 goes followers-only
-- because of preexisting chat
ASSERT (SELECT chat_allowed(10, 11) = TRUE);
ASSERT (SELECT chat_allowed(11, 10) = TRUE);

-- USER 10 revokes followers
UPDATE chat_permissions SET allowed = FALSE WHERE user_id = 10 AND permits = 'followers';
ASSERT (SELECT chat_allowed(2,10) = FALSE);

-- 10 cleares history... now 10 + 11 preexisting chat is invalidated
-- and followers-only applies
UPDATE chat_member SET cleared_history_at = now() where user_id = 10;
ASSERT (SELECT chat_allowed(11, 10) = FALSE);





end; $$ LANGUAGE plpgsql;
rollback;
