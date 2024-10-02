begin; do $$
declare
    agg_user aggregate_user%rowtype := null;
    agg_track aggregate_track%rowtype := null;

begin

ASSERT (SELECT chat_allowed(1,2) = TRUE);
insert into chat_blocked_users values (2, 1, now());
ASSERT (SELECT chat_allowed(1,2) = FALSE);

-- USER 10 allows followers
insert into chat_permissions values (10, 'followers', now());
ASSERT (SELECT chat_allowed(1,10) = FALSE);

-- USER 2 follows + can message
insert into follows
  (follower_user_id, followee_user_id, is_current, is_delete, created_at)
values
  (2, 10, true, false, now());
ASSERT (SELECT chat_allowed(2,10) = TRUE);

-- USER 10 revokes followers
UPDATE chat_permissions SET allowed = FALSE WHERE user_id = 10 AND permits = 'followers';
ASSERT (SELECT chat_allowed(2,10) = FALSE);





end; $$ LANGUAGE plpgsql;
rollback;
