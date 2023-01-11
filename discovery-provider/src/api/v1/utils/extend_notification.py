import logging
from datetime import datetime

from src.queries.get_notifications import Notification, NotificationAction
from src.utils.helpers import encode_int_id

logger = logging.getLogger(__name__)


def extend_notification(notification: Notification):
    notification["actions"] = list(
        map(extend_notification_action, notification["actions"])
    )
    if notification["is_seen"]:
        notification["seen_at"] = datetime.timestamp(notification["seen_at"])
    else:
        notification["seen_at"] = None
    return notification


def extend_notification_action(action: NotificationAction):
    type = action["type"]
    if type in notification_action_handler:
        handler = notification_action_handler[type]
        return handler(action)
    return None


def extend_follow(action: NotificationAction):
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "follower_user_id": encode_int_id(action["data"]["follower_user_id"]),
            "followee_user_id": encode_int_id(action["data"]["followee_user_id"]),
        },
    }


def extend_repost(action: NotificationAction):
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "type": action["data"]["type"],
            "user_id": encode_int_id(action["data"]["user_id"]),
            "repost_item_id": encode_int_id(action["data"]["repost_item_id"]),
        },
    }


def extend_save(action: NotificationAction):
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "type": action["data"]["type"],
            "user_id": encode_int_id(action["data"]["user_id"]),
            "save_item_id": encode_int_id(action["data"]["save_item_id"]),
        },
    }


def extend_remix(action: NotificationAction):
    # Specifier is the user who created the remix
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "parent_track_id": encode_int_id(action["data"]["parent_track_id"]),
            "track_id": encode_int_id(action["data"]["track_id"]),
        },
    }


def extend_cosign(action: NotificationAction):
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "track_owner_id": encode_int_id(action["data"]["track_owner_id"]),
            "parent_track_id": encode_int_id(action["data"]["parent_track_id"]),
            "track_id": encode_int_id(action["data"]["track_id"]),
        },
    }


def extend_create(action: NotificationAction):
    if "track_id" in action["data"]:
        return {
            "specifier": encode_int_id(int(action["specifier"])),
            "type": action["type"],
            "timestamp": datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"],
            "data": {
                "track_id": encode_int_id(action["data"]["track_id"]),
            },
        }
    else:
        return {
            "specifier": encode_int_id(int(action["specifier"])),
            "type": action["type"],
            "timestamp": datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"],
            "data": {
                "is_album": action["data"]["is_album"],
                "playlist_id": encode_int_id(action["data"]["playlist_id"]),
            },
        }


def extend_tip(action: NotificationAction):
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "amount": action["data"]["amount"],
            "sender_user_id": encode_int_id(action["data"]["sender_user_id"]),
            "receiver_user_id": encode_int_id(action["data"]["receiver_user_id"]),
        },
    }


def extend_support_rank_up(action: NotificationAction):
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "rank": action["data"]["rank"],
            "playlist_id": encode_int_id(action["data"]["playlist_id"]),
        },
    }


def extend_challenge_reward(action: NotificationAction):
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "amount": action["data"]["amount"],
            "specifier": action["data"]["specifier"],
            "challenge_id": action["data"]["challenge_id"],
        },
    }


def extend_reaction(action: NotificationAction):
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "reacted_to": action["data"]["reacted_to"],
            "reaction_type": action["data"]["reaction_type"],
            "sender_wallet": action["data"]["sender_wallet"],
            "reaction_value": action["data"]["reaction_value"],
        },
    }


def extend_milestone(action: NotificationAction):
    notification = {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": datetime.timestamp(action["timestamp"])
        if action["timestamp"]
        else action["timestamp"],
        "data": {
            "type": action["data"]["type"],
            "threshold": action["data"]["threshold"],
        },
    }
    if "track_id" in action["data"]:
        notification["data"]["track_id"] = encode_int_id(action["data"]["track_id"])
    if "playlist_id" in action["data"]:
        notification["data"]["playlist_id"] = encode_int_id(
            action["data"]["playlist_id"]
        )
    if "user_id" in action["data"]:
        notification["data"]["user_id"] = encode_int_id(action["data"]["user_id"])
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
}
