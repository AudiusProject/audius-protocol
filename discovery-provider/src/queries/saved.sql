-- saved
-- saved
select
    track_id,
    title,
    b.balance,
    b.associated_wallets_balance,
    total_score
from
    (
        select
            distinct on (owner_id) track_id,
            title,
            owner_id,
            total_score
        from
            (
                select
                    track_id,
                    title,
                    owner_id,
                    (
                        (5 * sum(score)) + (
                            12 * similarity(coalesce(title, ''), query)
                        ) + (
                            8 * similarity(coalesce(user_name, ''), query)
                        ) + (
                            15 * log(
                                case
                                    when (repost_count = 0) then 1
                                    else repost_count
                                end
                            )
                        ) + (
                            case
                                when (lower(query) = coalesce(title, '')) then 20
                                else 0
                            end
                        ) + (
                            case
                                when (lower(query) = handle) then 15
                                else 0
                            end
                        ) + (
                            case
                                when (lower(query) = user_name) then 5
                                else 0
                            end
                        )
                    ) as total_score
                from
                    (
                        select
                            d."track_id" as track_id,
                            d."word" as word,
                            similarity(d."word", 'house') as score,
                            d."track_title" as title,
                            'house' as query,
                            d."user_name" as user_name,
                            d."handle" as handle,
                            d."repost_count" as repost_count,
                            d."owner_id" as owner_id
                        from
                            "track_lexeme_dict" d
                            inner join "saves" s on s.save_item_id = d.track_id
                        where
                            (
                                d."word" % lower('house')
                                or d."handle" = lower('house')
                                or d."user_name" % lower('house')
                            )
                            and s.save_type = 'track'
                            and s.is_current = true
                            and s.is_delete = false
                            and s.user_id = 1
                    ) as results
                group by
                    track_id,
                    title,
                    query,
                    user_name,
                    handle,
                    repost_count,
                    owner_id
            ) as results2
        order by
            owner_id,
            total_score desc
    ) as u
    left join user_balances b on u.owner_id = b.user_id
order by
    total_score desc
limit
    100 offset 0