-- for all tables with is_current
-- use a fkey constraint that cascades delete
-- delete is_current false
begin;

-- terminate all active queries to avoid
SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE state = 'active' and pid <> pg_backend_pid();

LOCK TABLE reposts IN ACCESS EXCLUSIVE MODE;
LOCK TABLE saves IN ACCESS EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION log_message(message_text text)
RETURNS void AS
$$
BEGIN
    RAISE NOTICE '% %', pg_backend_pid(), message_text;
END;
$$
LANGUAGE plpgsql;

SELECT log_message('replacing reposts');

-- replace reposts
alter table reposts drop constraint if exists reposts_blocknumber_fkey;
create table reposts_new (like reposts including all);
insert into reposts_new select * from reposts where is_current = true and repost_type != 'album';
insert into reposts_new (blockhash, blocknumber, user_id, repost_item_id, repost_type, is_current, is_delete, created_at, txhash, slot, is_repost_of_repost)
select blockhash, blocknumber, user_id, repost_item_id,
       'playlist' as repost_type,
       is_current, is_delete, created_at, txhash, slot, is_repost_of_repost
from reposts
where is_current = true and repost_type = 'album';

SELECT log_message('replacing saves');

-- replace saves
alter table saves drop constraint if exists saves_blocknumber_fkey;
create table saves_new (like saves including all);
insert into saves_new select * from saves where is_current = true and save_type != 'album';
insert into saves_new (blockhash, blocknumber, user_id, save_item_id, save_type, is_current, is_delete, created_at, txhash, slot, is_save_of_repost)
select blockhash, blocknumber, user_id, save_item_id,
       'playlist' as save_type,
       is_current, is_delete, created_at, txhash, slot, is_save_of_repost
from saves
where is_current = true and save_type = 'album';

SELECT log_message('drop and replace tables');

drop materialized view if exists trending_params;
drop table reposts;
alter table reposts_new rename to reposts;
alter table reposts add constraint reposts_blocknumber_fkey foreign key (blocknumber) references blocks (number) on delete cascade;

drop table saves;
alter table saves_new rename to saves;
alter table saves add constraint saves_blocknumber_fkey foreign key (blocknumber) references blocks (number) on delete cascade;


-- recreate trending params

CREATE OR REPLACE FUNCTION recreate_trending_params()
RETURNS void AS
$$
BEGIN
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
END;
$$
LANGUAGE plpgsql;

select recreate_trending_params();

-- re-enable triggers
CREATE TRIGGER trg_reposts AFTER INSERT OR UPDATE ON public.reposts FOR EACH ROW EXECUTE PROCEDURE public.on_new_row();
CREATE TRIGGER on_repost AFTER INSERT ON public.reposts FOR EACH ROW EXECUTE PROCEDURE public.handle_repost();
CREATE TRIGGER trg_saves AFTER INSERT OR UPDATE ON public.saves FOR EACH ROW EXECUTE PROCEDURE public.on_new_row();
CREATE TRIGGER on_save AFTER INSERT ON public.saves FOR EACH ROW EXECUTE PROCEDURE public.handle_save();

commit;