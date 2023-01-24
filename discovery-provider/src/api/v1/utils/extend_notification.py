import logging
from datetime import datetime
from typing import List, Union

from src.queries.get_notifications import (
    ChallengeRewardNotification,
    CosignRemixNotification,
    CreatePlaylistNotification,
    CreateTrackNotification,
    FollowerMilestoneNotification,
    FollowNotification,
    Notification,
    NotificationAction,
    NotificationData,
    PlaylistMilestoneNotification,
    ReactionNotification,
    RemixNotification,
    RepostNotification,
    SaveNotification,
    SupporterRankUpNotification,
    SupportingRankUpNotification,
    TierChangeNotification,
    TipReceiveNotification,
    TipSendNotification,
    TrackMilestoneNotification,
)
from src.utils.helpers import encode_int_id

logger = logging.getLogger(__name__)


def extend_notification(notification: Notification):
    formatted = {
        "group_id": notification["group_id"],
        "is_seen": notification["is_seen"],
    }
    formatted["actions"] = list(
        map(extend_notification_action, notification["actions"])
    )
    if formatted["is_seen"] and formatted["seen_at"]:
        formatted["seen_at"] = datetime.timestamp(notification["seen_at"])
    else:
        formatted["seen_at"] = None
    return formatted


def extend_notification_action(action: NotificationAction):
    type = action["type"]
    if type in notification_action_handler:
        handler = notification_action_handler[type]
        return handler(action)
    return None


def validate_keys(keys: List[str], data: NotificationData):
    for key in keys:
        if key not in data:
            return False
    return True


def extend_follow(action: NotificationAction):
    data: FollowNotification = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "follower_user_id": encode_int_id(data["follower_user_id"]),
            "followee_user_id": encode_int_id(data["followee_user_id"]),
        },
    }


def extend_repost(action: NotificationAction):
    data: RepostNotification = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "type": data["type"],
            "user_id": encode_int_id(data["user_id"]),
            "repost_item_id": encode_int_id(data["repost_item_id"]),
        },
    }


def extend_save(action: NotificationAction):
    data: SaveNotification = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "type": data["type"],
            "user_id": encode_int_id(data["user_id"]),
            "save_item_id": encode_int_id(data["save_item_id"]),
        },
    }


def extend_remix(action: NotificationAction):
    data: RemixNotification = action["data"]  # type: ignore
    # Specifier is the user who created the remix
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "parent_track_id": encode_int_id(data["parent_track_id"]),
            "track_id": encode_int_id(data["track_id"]),
        },
    }


def extend_cosign(action: NotificationAction):
    data: CosignRemixNotification = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "track_owner_id": encode_int_id(data["track_owner_id"]),
            "parent_track_id": encode_int_id(data["parent_track_id"]),
            "track_id": encode_int_id(data["track_id"]),
        },
    }


def extend_create(action: NotificationAction):
    notification = {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {},
    }
    if "track_id" in action["data"]:
        track_data: CreateTrackNotification = action["data"]  # type: ignore
        notification["track_id"] = encode_int_id(track_data["track_id"])
    else:
        playlist_data: CreatePlaylistNotification = action["data"]  # type: ignore
        notification["is_album"] = playlist_data["is_album"]
        notification["playlist_id"] = (encode_int_id(playlist_data["playlist_id"]),)
    return notification


def extend_tip(action: NotificationAction):
    data: Union[TipReceiveNotification, TipSendNotification] = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "amount": data["amount"],
            "sender_user_id": encode_int_id(data["sender_user_id"]),
            "receiver_user_id": encode_int_id(data["receiver_user_id"]),
        },
    }


def extend_support_rank_up(action: NotificationAction):
    data: Union[SupporterRankUpNotification, SupportingRankUpNotification] = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "rank": data["rank"],
            "sender_user_id": encode_int_id(data["sender_user_id"]),
            "receiver_user_id": encode_int_id(data["receiver_user_id"]),
        },
    }


def extend_challenge_reward(action: NotificationAction):
    data: ChallengeRewardNotification = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "amount": data["amount"],
            "specifier": data["specifier"],
            "challenge_id": data["challenge_id"],
        },
    }


def extend_reaction(action: NotificationAction):
    data: ReactionNotification = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "reacted_to": data["reacted_to"],
            "reaction_type": data["reaction_type"],
            "sender_wallet": data["sender_wallet"],
            "reaction_value": data["reaction_value"],
        },
    }


def extend_milestone(action: NotificationAction):
    notification = {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
    }
    if "track_id" in action["data"]:
        track_data: TrackMilestoneNotification = action["data"]  # type: ignore
        notification["data"] = {
            "type": track_data["type"],
            "threshold": track_data["threshold"],
            "track_id": encode_int_id(track_data["track_id"]),
        }
    if "playlist_id" in action["data"]:
        playlist_data: PlaylistMilestoneNotification = action["data"]  # type: ignore
        notification["data"] = {
            "type": playlist_data["type"],
            "threshold": playlist_data["threshold"],
            "playlist_id": encode_int_id(playlist_data["playlist_id"]),
        }
    if "user_id" in action["data"]:
        user_data: FollowerMilestoneNotification = action["data"]  # type: ignore
        notification["data"] = {
            "type": user_data["type"],
            "threshold": user_data["threshold"],
            "user_id": encode_int_id(user_data["user_id"]),
        }
    return notification


def extend_tier_change(action: NotificationAction):
    data: TierChangeNotification = action["data"]  # type: ignore
    notification = {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": data,
    }
    return notification


notification_action_handler = {
    "follow": extend_follow,
    "repost": extend_repost,
    "save": extend_save,
    "milstone": extend_milestone,
    "remix": extend_remix,
    "cosign": extend_cosign,
    "create": extend_create,
    "tip_receive": extend_tip,
    "tip_send": extend_tip,
    "supporting_rank_up": extend_support_rank_up,
    "supporter_rank_up": extend_support_rank_up,
    "challenge_reward": extend_challenge_reward,
    "reaction": extend_reaction,
    "tier_change": extend_tier_change,
}
