import logging
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Optional, TypedDict, Union

from sqlalchemy import bindparam, text
from sqlalchemy.orm.session import Session

logger = logging.getLogger(__name__)


class GetNotificationArgs(TypedDict):
    user_id: int
    timestamp: Optional[int]
    limit: Optional[int]


notification_groups_sql = text(
    """
--- Create Intervals of user seen
WITH user_seen as (
  SELECT
    LAG(seen_at, 1, now()::timestamp) OVER ( ORDER BY seen_at desc ) AS seen_at,
    seen_at as prev_seen_at
  FROM
    notification_seen
---  Not sure if we should add the following - redundant, but could be faster/slower
---  WHERE
---    (:timestamp_offset is NULL or seen_at < :timestamp_offset)
  WHERE
    user_id = :user_id
---  Not sure if we should add the following - redundant, but could be faster/slower
---  ORDER BY
---    seen_at desc
)
SELECT
    n.group_id as group_id,
    array_agg(n.id),
    CASE 
      WHEN user_seen.seen_at is not NULL THEN now()::timestamp != user_seen.seen_at
      ELSE EXISTS(SELECT 1 from notification_seen where user_id = :user_id)
    END as is_seen,
    CASE 
      WHEN user_seen.seen_at is not NULL THEN user_seen.seen_at
      ELSE (
        SELECT seen_at from notification_seen
        WHERE user_id = :user_id
        ORDER BY seen_at ASC
        limit 1
      )
    END as seen_at,
    user_seen.prev_seen_at,
    count(n.group_id)
FROM
    notification n
LEFT JOIN user_seen on
  user_seen.seen_at >= n.timestamp and user_seen.prev_seen_at < n.timestamp
WHERE
  :user_id = ANY(n.user_ids) AND
  (:timestamp_offset is NULL or n.timestamp <= :timestamp_offset) AND
  (:group_id_offset is NULL OR n.group_id < :group_id_offset)
GROUP BY
  n.group_id, user_seen.seen_at, user_seen.prev_seen_at
ORDER BY
  user_seen.seen_at desc NULLS LAST,
  n.group_id desc
limit :limit;
"""
)


MAX_LIMIT = 50
DEFAULT_LIMIT = 20


class NotificationGroup(TypedDict):
    group_id: str
    notification_ids: List[int]
    is_seen: bool
    seen_at: datetime
    prev_seen_at: datetime
    count: int


def get_notification_groups(session: Session, args: GetNotificationArgs):
    """
    Gets the user's notifiations in the database
    """

    limit = min(args.get("limit", DEFAULT_LIMIT), MAX_LIMIT)  # type: ignore

    rows = session.execute(
        notification_groups_sql,
        {
            "user_id": args["user_id"],
            "limit": limit,
            "timestamp_offset": None,
            "group_id_offset": None,
        },
    )
    res: List[NotificationGroup] = [
        {
            "group_id": r[0],
            "notification_ids": r[1],
            "is_seen": r[2] if r[2] != None else False,
            "seen_at": r[3],
            "prev_seen_at": r[4],
            "count": r[5],
        }
        for r in rows
    ]
    logger.info(res)

    return res


class FollowNotification(TypedDict):
    follower_user_id: int
    followee_user_id: int


class RepostNotification(TypedDict):
    type: str
    user_id: int
    repost_item_id: int


class SaveNotification(TypedDict):
    type: str
    user_id: int
    save_item_id: int


class MilestoneNotification(TypedDict):
    type: str
    threshold: int


class RemixNotification(TypedDict):
    parent_track_id: int
    track_id: int


class CosignRemixNotification(TypedDict):
    parent_track_id: int
    track_id: int


NotificationData = Union[
    FollowNotification,
    RepostNotification,
    SaveNotification,
    MilestoneNotification,
    RemixNotification,
    CosignRemixNotification,
]


class NotificationAction(TypedDict):
    specifier: str
    type: str
    timestamp: datetime
    data: NotificationData


class Notification(TypedDict):
    group_id: str
    is_seen: bool
    seen_at: datetime
    actions: List[NotificationAction]


notifications_sql = text(
    """
SELECT
    id,
    type,
    specifier,
    timestamp,
    data
FROM notification n
WHERE n.id in :notification_ids
"""
)
notifications_sql = notifications_sql.bindparams(
    bindparam("notification_ids", expanding=True)
)


def get_notifications(session: Session, args: GetNotificationArgs):
    notifications = get_notification_groups(session, args)
    notification_ids = []
    logger.info(notifications)
    for notification in notifications:
        notification_ids.extend(notification["notification_ids"])

    rows = session.execute(notifications_sql, {"notification_ids": notification_ids})

    notification_id_data: Dict[int, NotificationAction] = defaultdict()

    for row in rows:
        notification_id_data[row[0]] = {
            "type": row[1],
            "specifier": row[2],
            "timestamp": row[3],
            "data": row[4],
        }

    notifications_and_actions = [
        {
            **notification,
            "actions": [
                notification_id_data[id] for id in notification["notification_ids"]
            ],
        }
        for notification in notifications
    ]

    logger.info(notifications_and_actions)

    return notifications_and_actions
