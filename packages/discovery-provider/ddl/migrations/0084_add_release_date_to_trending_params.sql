-- Add release_date to trending params
begin;

CREATE OR REPLACE FUNCTION recreate_trending_params()
RETURNS void AS
$$
BEGIN
    create materialized view public.trending_params as
    select
    t.track_id,
    t.release_date,
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

drop materialized view if exists trending_params;
select recreate_trending_params();

commit;