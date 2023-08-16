-- for all tables with is_current
-- add a fkey constraint that cascades delete
-- delete rows with is_current false
begin;

-- drop_fk_constraints: drop existing fk constraints so they can be recreated with cascade deletes
create
or replace function drop_fk_constraints(_ref_table_name text) returns void as $$ declare _constraint_name text;

_table_name text;

begin for _constraint_name,
_table_name in
select
   conname,
   conrelid :: regclass :: text
from
   pg_constraint
where
   confrelid = _ref_table_name :: regclass
   and conrelid :: regclass :: text <> 'revert_blocks' -- exclude revert_blocks since its constraint is correct
   loop execute format(
      'alter table %s drop constraint if exists %s',
      quote_ident(_table_name),
      quote_ident(_constraint_name)
   );

end loop;

end $$ language plpgsql;

select
   drop_fk_constraints('blocks');

-- replace_table: copy is_current true rows and replace existing tables 
create
or replace function replace_table(_table_names text []) returns void as $$ declare _table_name text;

_new_table_name text;

begin foreach _table_name in array _table_names loop _new_table_name := 'new_' || _table_name;

-- logging the replacement
raise notice 'replacing table % with new table %',
_table_name,
_new_table_name;

-- create a new table with the same structure as the old table
execute format(
   'create table %s (like %s including all)',
   _new_table_name,
   _table_name
);

-- copy rows with is_current = true from the old table to the new table
execute format(
   'insert into %s select * from %s where is_current = true',
   _new_table_name,
   _table_name
);

-- drop the old table
execute format('drop table %s', _table_name);

-- rename the new table to the original table's name
execute format(
   'alter table %s rename to %s',
   _new_table_name,
   _table_name
);

end loop;

end $$ language plpgsql;

-- drop mat views so existing tables with is_current false can be dropped
drop materialized view if exists trending_params;

drop materialized view if exists aggregate_interval_plays;

drop materialized view if exists tag_track_user;

ALTER TABLE associated_wallets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE user_events ALTER COLUMN id DROP DEFAULT;

-- replace is_current tables but exclude playlist_routes and track_routes 
-- routes tables need is_current false to preserve slugs
select replace_table(
  array[
    'associated_wallets',
    'developer_apps',
    'follows',
    'grants',
    'playlists', 
    'playlist_seen',
    'reposts',
    'saves',
    'subscriptions',
    'tracks',
    'user_events',
    'users'
  ]
);


-- Recreate the default value
CREATE SEQUENCE associated_wallets_id_seq;
CREATE SEQUENCE user_events_id_seq;

ALTER TABLE associated_wallets ALTER COLUMN id SET DEFAULT nextval('associated_wallets_id_seq');
ALTER TABLE user_events ALTER COLUMN id SET DEFAULT nextval('user_events_id_seq');

-- add_fk_constraints: add cascading fk constraints
create
or replace function add_fk_constraints(_table_names text []) returns void as $$ declare _table_name text;

begin foreach _table_name in array _table_names loop -- logging the action
raise notice 'adding foreign key constraint to table %',
_table_name;

execute format(
   'alter table %s add constraint %s foreign key (blocknumber) references blocks (number) on delete cascade',
   quote_ident(_table_name),
   quote_ident(_table_name || '_blocknumber_fkey')
);

end loop;

end $$ language plpgsql;

select
   add_fk_constraints(
      array [
    'associated_wallets', 
    'developer_apps', 
    'follows', 
    'grants', 
    'playlist_routes', 
    'playlists', 
    'playlist_seen', 
    'reposts', 
    'saves', 
    'subscriptions', 
    'track_routes', 
    'tracks', 
    'user_events', 
    'users'
]
   );

-- recreate materialized views and indexes
-- recreate trending_params
create materialized view public.trending_params as
select
   t.track_id,
   t.genre,
   t.owner_id,
   ap.play_count,
   au.follower_count as owner_follower_count,
   coalesce(aggregate_track.repost_count, 0) as repost_count,
   coalesce(aggregate_track.save_count, 0) as save_count,
   coalesce(repost_week.repost_count, (0) :: bigint) as repost_week_count,
   coalesce(repost_month.repost_count, (0) :: bigint) as repost_month_count,
   coalesce(repost_year.repost_count, (0) :: bigint) as repost_year_count,
   coalesce(save_week.repost_count, (0) :: bigint) as save_week_count,
   coalesce(save_month.repost_count, (0) :: bigint) as save_month_count,
   coalesce(save_year.repost_count, (0) :: bigint) as save_year_count,
   coalesce(karma.karma, (0) :: numeric) as karma
from
   (
      (
         (
            (
               (
                  (
                     (
                        (
                           (
                              (
                                 public.tracks t
                                 left join (
                                    select
                                       ap_1.count as play_count,
                                       ap_1.play_item_id
                                    from
                                       public.aggregate_plays ap_1
                                 ) ap on ((ap.play_item_id = t.track_id))
                              )
                              left join (
                                 select
                                    au_1.user_id,
                                    au_1.follower_count
                                 from
                                    public.aggregate_user au_1
                              ) au on ((au.user_id = t.owner_id))
                           )
                           left join (
                              select
                                 aggregate_track_1.track_id,
                                 aggregate_track_1.repost_count,
                                 aggregate_track_1.save_count
                              from
                                 public.aggregate_track aggregate_track_1
                           ) aggregate_track on ((aggregate_track.track_id = t.track_id))
                        )
                        left join (
                           select
                              r.repost_item_id as track_id,
                              count(r.repost_item_id) as repost_count
                           from
                              public.reposts r
                           where
                              (
                                 (r.is_current is true)
                                 and (r.repost_type = 'track' :: public.reposttype)
                                 and (r.is_delete is false)
                                 and (r.created_at > (now() - '1 year' :: interval))
                              )
                           group by
                              r.repost_item_id
                        ) repost_year on ((repost_year.track_id = t.track_id))
                     )
                     left join (
                        select
                           r.repost_item_id as track_id,
                           count(r.repost_item_id) as repost_count
                        from
                           public.reposts r
                        where
                           (
                              (r.is_current is true)
                              and (r.repost_type = 'track' :: public.reposttype)
                              and (r.is_delete is false)
                              and (r.created_at > (now() - '1 mon' :: interval))
                           )
                        group by
                           r.repost_item_id
                     ) repost_month on ((repost_month.track_id = t.track_id))
                  )
                  left join (
                     select
                        r.repost_item_id as track_id,
                        count(r.repost_item_id) as repost_count
                     from
                        public.reposts r
                     where
                        (
                           (r.is_current is true)
                           and (r.repost_type = 'track' :: public.reposttype)
                           and (r.is_delete is false)
                           and (r.created_at > (now() - '7 days' :: interval))
                        )
                     group by
                        r.repost_item_id
                  ) repost_week on ((repost_week.track_id = t.track_id))
               )
               left join (
                  select
                     r.save_item_id as track_id,
                     count(r.save_item_id) as repost_count
                  from
                     public.saves r
                  where
                     (
                        (r.is_current is true)
                        and (r.save_type = 'track' :: public.savetype)
                        and (r.is_delete is false)
                        and (r.created_at > (now() - '1 year' :: interval))
                     )
                  group by
                     r.save_item_id
               ) save_year on ((save_year.track_id = t.track_id))
            )
            left join (
               select
                  r.save_item_id as track_id,
                  count(r.save_item_id) as repost_count
               from
                  public.saves r
               where
                  (
                     (r.is_current is true)
                     and (r.save_type = 'track' :: public.savetype)
                     and (r.is_delete is false)
                     and (r.created_at > (now() - '1 mon' :: interval))
                  )
               group by
                  r.save_item_id
            ) save_month on ((save_month.track_id = t.track_id))
         )
         left join (
            select
               r.save_item_id as track_id,
               count(r.save_item_id) as repost_count
            from
               public.saves r
            where
               (
                  (r.is_current is true)
                  and (r.save_type = 'track' :: public.savetype)
                  and (r.is_delete is false)
                  and (r.created_at > (now() - '7 days' :: interval))
               )
            group by
               r.save_item_id
         ) save_week on ((save_week.track_id = t.track_id))
      )
      left join (
         select
            save_and_reposts.item_id as track_id,
            sum(au_1.follower_count) as karma
         from
            (
               (
                  select
                     r_and_s.user_id,
                     r_and_s.item_id
                  from
                     (
                        (
                           select
                              reposts.user_id,
                              reposts.repost_item_id as item_id
                           from
                              public.reposts
                           where
                              (
                                 (reposts.is_delete is false)
                                 and (reposts.is_current is true)
                                 and (
                                    reposts.repost_type = 'track' :: public.reposttype
                                 )
                              )
                           union
                           all
                           select
                              saves.user_id,
                              saves.save_item_id as item_id
                           from
                              public.saves
                           where
                              (
                                 (saves.is_delete is false)
                                 and (saves.is_current is true)
                                 and (saves.save_type = 'track' :: public.savetype)
                              )
                        ) r_and_s
                        join public.users on ((r_and_s.user_id = users.user_id))
                     )
                  where
                     (
                        (
                           (users.cover_photo is not null)
                           or (users.cover_photo_sizes is not null)
                        )
                        and (
                           (users.profile_picture is not null)
                           or (users.profile_picture_sizes is not null)
                        )
                        and (users.bio is not null)
                     )
               ) save_and_reposts
               join public.aggregate_user au_1 on ((save_and_reposts.user_id = au_1.user_id))
            )
         group by
            save_and_reposts.item_id
      ) karma on ((karma.track_id = t.track_id))
   )
where
   (
      (t.is_current is true)
      and (t.is_delete is false)
      and (t.is_unlisted is false)
      and (t.stem_of is null)
   ) with no data;

create index trending_params_track_id_idx on public.trending_params using btree (track_id);

-- recreate aggregate_interval_plays
create materialized view public.aggregate_interval_plays as
select
   tracks.track_id,
   tracks.genre,
   tracks.created_at,
   coalesce(week_listen_counts.count, (0) :: bigint) as week_listen_counts,
   coalesce(month_listen_counts.count, (0) :: bigint) as month_listen_counts
from
   (
      (
         public.tracks
         left join (
            select
               plays.play_item_id,
               count(plays.id) as count
            from
               public.plays
            where
               (
                  plays.created_at > (now() - '7 days' :: interval)
               )
            group by
               plays.play_item_id
         ) week_listen_counts on (
            (
               week_listen_counts.play_item_id = tracks.track_id
            )
         )
      )
      left join (
         select
            plays.play_item_id,
            count(plays.id) as count
         from
            public.plays
         where
            (plays.created_at > (now() - '1 mon' :: interval))
         group by
            plays.play_item_id
      ) month_listen_counts on (
         (
            month_listen_counts.play_item_id = tracks.track_id
         )
      )
   )
where
   (
      (tracks.is_current is true)
      and (tracks.is_delete is false)
      and (tracks.is_unlisted is false)
      and (tracks.stem_of is null)
   ) with no data;

create index interval_play_month_count_idx on public.aggregate_interval_plays using btree (month_listen_counts);

create index interval_play_track_id_idx on public.aggregate_interval_plays using btree (track_id);

create index interval_play_week_count_idx on public.aggregate_interval_plays using btree (week_listen_counts);

-- recreate tag_track_user
create materialized view public.tag_track_user as
select
   unnest(t.tags) as tag,
   t.track_id,
   t.owner_id
from
   (
      select
         string_to_array(lower((tracks.tags) :: text), ',' :: text) as tags,
         tracks.track_id,
         tracks.owner_id
      from
         public.tracks
      where
         (
            ((tracks.tags) :: text <> '' :: text)
            and (tracks.tags is not null)
            and (tracks.is_current is true)
            and (tracks.is_unlisted is false)
            and (tracks.stem_of is null)
         )
      order by
         tracks.updated_at desc
   ) t
group by
   (unnest(t.tags)),
   t.track_id,
   t.owner_id with no data;

create unique index tag_track_user_idx on public.tag_track_user using btree (tag, track_id, owner_id);

create index tag_track_user_tag_idx on public.tag_track_user using btree (tag);

commit;