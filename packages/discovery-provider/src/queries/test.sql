SELECT comments.comment_id,
    comments.text,
    comments.user_id,
    comments.entity_id,
    comments.entity_type,
    comments.track_timestamp_s,
    comments.created_at,
    comments.updated_at,
    comments.is_delete,
    comments.is_visible,
    comments.is_edited,
    comments.txhash,
    comments.blockhash,
    comments.blocknumber,
    count(comment_reactions.comment_id) AS react_count,
    count(comment_threads_1.comment_id) AS reply_count,
    comment_notification_settings.is_muted
FROM comments
    LEFT OUTER JOIN comment_threads AS comment_threads_2 ON comments.comment_id = comment_threads_2.comment_id
    LEFT OUTER JOIN comment_reports ON comments.comment_id = comment_reports.comment_id
    LEFT OUTER JOIN aggregate_user ON aggregate_user.user_id = comment_reports.user_id
    LEFT OUTER JOIN comment_reactions ON comments.comment_id = comment_reactions.comment_id
    LEFT OUTER JOIN muted_users ON muted_users.muted_user_id = comments.user_id
    AND muted_users.user_id IS NULL
    LEFT OUTER JOIN comment_threads AS comment_threads_1 ON comments.comment_id = comment_threads_1.parent_comment_id
    LEFT OUTER JOIN comment_notification_settings ON comments.comment_id = comment_notification_settings.entity_id
    AND comment_notification_settings.entity_type = 'Comment'
WHERE comments.entity_id = 977335461
    AND comments.entity_type = 'Track'
    AND comment_threads_2.parent_comment_id IS NULL
    AND true
    AND (
        comment_reports.comment_id IS NULL
        OR comment_reports.comment_id != 977335461
    )
    AND (
        muted_users.muted_user_id IS NULL
        OR muted_users.is_delete = true
    )
GROUP BY comments.comment_id,
    comment_notification_settings.is_muted
HAVING (
        count(comment_threads_1.comment_id) > 0
        OR comments.is_delete = false
    )
    AND coalesce(sum(aggregate_user.follower_count), 0) <= 1720000
ORDER BY comments.comment_id IS NULL DESC,
    comments.is_delete ASC,
    count(comment_reactions.comment_id) DESC,
    sum(aggregate_user.follower_count) DESC,
    comments.created_at DESC