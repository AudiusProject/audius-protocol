begin;

drop table if exists action_log;

create table action_log (
  actor_user_id int not null,

  -- one of: follow, repost, save, tip, etc.
  verb text not null,

  -- rather than have object_type and object_id
  -- we instead have explicit ID columns per type that are nullable
  -- i.e. for a track repost, track_id will exist
  user_id int,
  track_id int,
  playlist_id int,

  -- created_at should be the earliest this event happened
  -- this value should not change even if you follow / unfollow or repost / unrepost repeatedly
  created_at timestamp with time zone not null,
  blocknumber int not null,

   UNIQUE (actor_user_id, verb, user_id, track_id, playlist_id)
);

-- repost track
insert into action_log
  (actor_user_id, verb, track_id, user_id, created_at, blocknumber)
select
  r.user_id, 'repost', r.repost_item_id, t.owner_id, r.created_at, r.blocknumber
from reposts r
join tracks t
  on track_id = repost_item_id
  and t.is_current = true
  and t.is_available = true
  and t.is_delete = false
  and t.is_unlisted = false
where r.is_current = true
  and r.is_delete = false
  and repost_type = 'track'
order by r.blocknumber desc
;

-- repost playlist
insert into action_log
  (actor_user_id, verb, playlist_id, user_id, created_at, blocknumber)
select
  r.user_id, 'repost', r.repost_item_id, p.playlist_owner_id, r.created_at, r.blocknumber
from reposts r
join playlists p
  on p.playlist_id = r.repost_item_id
  and p.is_current = true
  and p.is_private = false
  and p.is_delete = false
where r.is_current = true
  and r.is_delete = false
  and repost_type in ('playlist', 'album')
order by r.blocknumber desc
;






-- save track
insert into action_log
  (actor_user_id, verb, track_id, user_id, created_at, blocknumber)
select
  r.user_id, 'save', r.save_item_id, t.owner_id, r.created_at, r.blocknumber
from saves r
join tracks t
  on track_id = save_item_id
  and t.is_current = true
  and t.is_available = true
  and t.is_delete = false
  and t.is_unlisted = false
where r.is_current = true
  and r.is_delete = false
  and save_type = 'track'
order by r.blocknumber desc
;

-- save playlist
insert into action_log
  (actor_user_id, verb, playlist_id, user_id, created_at, blocknumber)
select
  r.user_id, 'save', r.save_item_id, p.playlist_owner_id, r.created_at, r.blocknumber
from saves r
join playlists p
  on p.playlist_id = r.save_item_id
  and p.is_current = true
  and p.is_private = false
  and p.is_delete = false
where r.is_current = true
  and r.is_delete = false
  and save_type in ('playlist', 'album')
order by r.blocknumber desc
;



-- follow
insert into action_log
  (actor_user_id, verb, user_id, created_at, blocknumber)
select
    follower_user_id, 'follow', followee_user_id, created_at, blocknumber
from follows
where is_current = true and is_delete = false
order by blocknumber desc
;


-- post track
insert into action_log
  (actor_user_id, verb, user_id, track_id, created_at, blocknumber)
select
    owner_id, 'post', owner_id, track_id, created_at, blocknumber
from tracks t
where t.is_current = true
  and t.is_available = true
  and t.is_delete = false
  and t.is_unlisted = false
order by blocknumber desc
;

-- post playlist
insert into action_log
  (actor_user_id, verb, user_id, playlist_id, created_at, blocknumber)
select
    playlist_owner_id, 'post', playlist_owner_id, playlist_id, created_at, blocknumber
from playlists p
where p.is_current = true
  and p.is_private = false
  and p.is_delete = false
order by blocknumber desc
;


create index action_log_created_at_idx on action_log(created_at, actor_user_id);
create index action_log_user_id_idx on action_log(user_id, created_at);

create index action_log_track_id_idx on action_log(track_id, actor_user_id);
create index action_log_playlist_id_idx on action_log(playlist_id, actor_user_id);

commit;


/*
TMI FEED:

explain select * from action_log
where actor_user_id in (select user_id from action_log where verb = 'follow' and actor_user_id = 197005)
order by created_at desc
limit 100;

Grouped Feed:

select
  verb,
  user_id,
  playlist_id,
  track_id,
  min(created_at),
  array_to_json(array_agg(row_to_json(al)))
from action_log al
where actor_user_id in (select user_id from action_log where verb = 'follow' and actor_user_id = 197005)
group by 1, 2, 3, 4
order by 5 desc
limit 100;


explain select
  verb,
  user_id,
  playlist_id,
  track_id,
  min(created_at),
  array_to_json(array_agg(json_build_object('u', actor_user_id, 'w', created_at)))
from action_log al
where actor_user_id in (select user_id from action_log where verb = 'follow' and actor_user_id = 197005)
  and created_at > now() - interval '30 days'
group by 1, 2, 3, 4
order by 5 desc
limit 100;

NOTIFS:

explain select * from action_log
where user_id = 197005
order by created_at desc
limit 1000;


todo:
- subscribe should be a verb
- tips
- reactions
- rank ups

create role web_anon;
grant select on action_log, users, tracks to web_anon;

*/
