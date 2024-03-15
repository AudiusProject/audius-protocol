import logging
from datetime import datetime
from typing import List, Union, cast

from src.queries.get_notifications import (
    AnnouncementNotification,
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
    RepostOfRepostNotification,
    SaveNotification,
    SaveOfRepostNotification,
    SupporterDethronedNotification,
    SupporterRankUpNotification,
    SupportingRankUpNotification,
    TastemakerNotification,
    TierChangeNotification,
    TipReceiveNotification,
    TipSendNotification,
    TrackAddedToPlaylistNotification,
    TrackMilestoneNotification,
    TrendingNotification,
    TrendingPlaylistNotification,
    TrendingUndergroundNotification,
    UsdcPurchaseBuyerNotification,
    UsdcPurchaseSellerNotification,
)
from src.utils.helpers import encode_int_id
from src.utils.spl_audio import to_wei_string

logger = logging.getLogger(__name__)


def extend_notification(notification: Notification):
    formatted = {
        "type": notification["type"],
        "group_id": notification["group_id"],
        "is_seen": notification["is_seen"],
    }
    formatted["actions"] = list(
        map(extend_notification_action, notification["actions"])
    )
    if formatted["is_seen"] and notification["seen_at"]:
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
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
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
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "type": data["type"],
            "user_id": encode_int_id(data["user_id"]),
            "repost_item_id": encode_int_id(data["repost_item_id"]),
        },
    }


def extend_repost_of_a_repost(action: NotificationAction):
    data: RepostOfRepostNotification = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "type": data["type"],
            "user_id": encode_int_id(data["user_id"]),
            "repost_of_repost_item_id": encode_int_id(data["repost_of_repost_item_id"]),
        },
    }


def extend_save_of_repost(action: NotificationAction):
    data: SaveOfRepostNotification = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "type": data["type"],
            "user_id": encode_int_id(data["user_id"]),
            "save_of_repost_item_id": encode_int_id(data["save_of_repost_item_id"]),
        },
    }


def extend_save(action: NotificationAction):
    data: SaveNotification = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "type": data["type"],
            "user_id": encode_int_id(data["user_id"]),
            "save_item_id": encode_int_id(data["save_item_id"]),
        },
    }


def extend_tastemaker(action: NotificationAction):
    data: TastemakerNotification = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "tastemaker_item_owner_id": encode_int_id(data["tastemaker_item_owner_id"]),
            "tastemaker_item_id": encode_int_id(data["tastemaker_item_id"]),
            "action": data["action"],
            "tastemaker_item_type": data["tastemaker_item_type"],
            "tastemaker_user_id": encode_int_id(data["tastemaker_user_id"]),
        },
    }


def extend_remix(action: NotificationAction):
    data: RemixNotification = action["data"]  # type: ignore
    # Specifier is the user who created the remix
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "parent_track_id": encode_int_id(data["parent_track_id"]),
            "track_id": encode_int_id(data["track_id"]),
            "track_owner_id": encode_int_id(int(action["specifier"])),
        },
    }


def extend_cosign(action: NotificationAction):
    data: CosignRemixNotification = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "track_owner_id": encode_int_id(data["track_owner_id"]),
            "parent_track_owner_id": encode_int_id(int(action["specifier"])),
            "parent_track_id": encode_int_id(data["parent_track_id"]),
            "track_id": encode_int_id(data["track_id"]),
        },
    }


def extend_create(action: NotificationAction):
    notification = {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {},
    }
    if "track_id" in action["data"]:
        track_data: CreateTrackNotification = action["data"]  # type: ignore
        notification["data"]["track_id"] = encode_int_id(track_data["track_id"])
    else:
        playlist_data: CreatePlaylistNotification = action["data"]  # type: ignore
        notification["data"]["is_album"] = playlist_data["is_album"]
        notification["data"]["playlist_id"] = (
            encode_int_id(playlist_data["playlist_id"]),
        )
    return notification


def extend_send_tip(action: NotificationAction):
    data: Union[TipReceiveNotification, TipSendNotification] = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "amount": to_wei_string(data["amount"]),
            "sender_user_id": encode_int_id(data["sender_user_id"]),
            "receiver_user_id": encode_int_id(data["receiver_user_id"]),
            "tip_tx_signature": data["tx_signature"],
        },
    }


def extend_receive_tip(action: NotificationAction):
    data: Union[TipReceiveNotification, TipSendNotification] = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "amount": to_wei_string(data["amount"]),
            "sender_user_id": encode_int_id(data["sender_user_id"]),
            "receiver_user_id": encode_int_id(data["receiver_user_id"]),
            "tip_tx_signature": data["tx_signature"],
            "reaction_value": (
                data["reaction_value"]  # type: ignore
                if "reaction_value" in data
                else None
            ),
        },
    }


def extend_supporter_rank_up(action: NotificationAction):
    data: Union[SupporterRankUpNotification, SupportingRankUpNotification] = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "rank": data["rank"],
            "sender_user_id": encode_int_id(data["sender_user_id"]),
            "receiver_user_id": encode_int_id(data["receiver_user_id"]),
        },
    }


def extend_supporter_dethroned(action: NotificationAction):
    data: SupporterDethronedNotification = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "dethroned_user_id": encode_int_id(data["dethroned_user_id"]),
            "sender_user_id": encode_int_id(data["sender_user_id"]),
            "receiver_user_id": encode_int_id(data["receiver_user_id"]),
        },
    }


def extend_challenge_reward(action: NotificationAction):
    data: ChallengeRewardNotification = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "amount": to_wei_string(data["amount"]),
            "specifier": data["specifier"],
            "challenge_id": data["challenge_id"],
        },
    }


def extend_reaction(action: NotificationAction):
    data: ReactionNotification = action["data"]  # type: ignore
    return {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "reacted_to": data["reacted_to"],
            "reaction_type": data["reaction_type"],
            "sender_wallet": data["sender_wallet"],
            "reaction_value": data["reaction_value"],
            "receiver_user_id": encode_int_id(data["receiver_user_id"]),
            "sender_user_id": encode_int_id(data["sender_user_id"]),
            "tip_amount": to_wei_string(data["tip_amount"]),
        },
    }


def extend_milestone(action: NotificationAction):
    type = action["type"].lower()
    logger.info("notification mapping")
    notification = {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": type,
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
    }

    if action["group_id"].startswith("milestone:PLAYLIST_REPOST_COUNT") or action[
        "group_id"
    ].startswith("milestone:PLAYLIST_SAVE_COUNT"):
        group_id_parts = action["group_id"].split(":")
        id = int(group_id_parts[3])
        playlist_data: PlaylistMilestoneNotification = action["data"]  # type: ignore
        notification["data"] = {
            "type": playlist_data["type"].lower(),
            "threshold": playlist_data["threshold"],
            "playlist_id": encode_int_id(id),
            "is_album": playlist_data.get("is_album", False),
        }
    elif action["group_id"].startswith("milestone:TRACK_SAVE_COUNT") or action[
        "group_id"
    ].startswith("milestone:TRACK_REPOST_COUNT"):
        group_id_parts = action["group_id"].split(":")
        id = int(group_id_parts[3])
        playlist_data: PlaylistMilestoneNotification = action["data"]  # type: ignore
        notification["data"] = {
            "type": playlist_data["type"].lower(),
            "threshold": playlist_data["threshold"],
            "track_id": encode_int_id(id),
        }

    elif action["group_id"].startswith("milestone:LISTEN_COUNT"):
        track_data: TrackMilestoneNotification = action["data"]  # type: ignore
        notification["data"] = {
            "type": track_data["type"].lower(),
            "threshold": track_data["threshold"],
            "track_id": encode_int_id(track_data["track_id"]),
        }
    elif action["group_id"].startswith("milestone:FOLLOWER_COUNT"):
        logger.info("notification mapping found follower ")
        user_data: FollowerMilestoneNotification = action["data"]  # type: ignore
        notification["data"] = {
            "type": user_data["type"].lower(),
            "threshold": user_data["threshold"],
            "user_id": encode_int_id(user_data["user_id"]),
        }
    return notification


def extend_tier_change(action: NotificationAction):
    data: TierChangeNotification = action["data"]  # type: ignore
    notification = {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": data,
    }
    return notification


def extend_track_added_to_playlist(action: NotificationAction):
    data: TrackAddedToPlaylistNotification = cast(
        TrackAddedToPlaylistNotification, action["data"]
    )
    notification = {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "track_id": encode_int_id(data["track_id"]),
            "playlist_id": encode_int_id(data["playlist_id"]),
            "playlist_owner_id": (
                encode_int_id(data["playlist_owner_id"])
                if data.get("playlist_owner_id")
                else None
            ),
        },
    }
    return notification


def extend_trending(action: NotificationAction):
    data: TrendingNotification = action["data"]  # type: ignore
    notification = {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "rank": data["rank"],
            "genre": data["genre"],
            "track_id": encode_int_id(data["track_id"]),
            "time_range": data["time_range"],
        },
    }
    return notification


def extend_trending_playlist(action: NotificationAction):
    data: TrendingPlaylistNotification = action["data"]  # type: ignore
    notification = {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "rank": data["rank"],
            "genre": data["genre"],
            "playlist_id": encode_int_id(data["playlist_id"]),
            "time_range": data["time_range"],
        },
    }
    return notification


def extend_usdc_purchase_seller(action: NotificationAction):
    data: UsdcPurchaseSellerNotification = action["data"]  # type: ignore
    notification = {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "content_type": data["content_type"],
            "buyer_user_id": encode_int_id(data["buyer_user_id"]),
            "seller_user_id": encode_int_id(data["seller_user_id"]),
            "amount": str(data["amount"]),
            "extra_amount": (
                str(data["extra_amount"]) if "extra_amount" in data else "0"
            ),
            "content_id": encode_int_id(data["content_id"]),
        },
    }
    return notification


def extend_usdc_purchase_buyer(action: NotificationAction):
    data: UsdcPurchaseBuyerNotification = action["data"]  # type: ignore
    notification = {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "content_type": data["content_type"],
            "buyer_user_id": encode_int_id(data["buyer_user_id"]),
            "seller_user_id": encode_int_id(data["seller_user_id"]),
            "amount": str(data["amount"]),
            "extra_amount": (
                str(data["extra_amount"]) if "extra_amount" in data else "0"
            ),
            "content_id": encode_int_id(data["content_id"]),
        },
    }
    return notification


def extend_trending_underground(action: NotificationAction):
    data: TrendingUndergroundNotification = action["data"]  # type: ignore
    notification = {
        "specifier": encode_int_id(int(action["specifier"])),
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": {
            "rank": data["rank"],
            "genre": data["genre"],
            "track_id": encode_int_id(data["track_id"]),
            "time_range": data["time_range"],
        },
    }
    return notification


def extend_announcement(action: NotificationAction):
    data: AnnouncementNotification = action["data"]  # type: ignore
    notification = {
        "specifier": None,
        "type": action["type"],
        "timestamp": (
            datetime.timestamp(action["timestamp"])
            if action["timestamp"]
            else action["timestamp"]
        ),
        "data": data,
    }
    return notification


notification_action_handler = {
    "follow": extend_follow,
    "repost": extend_repost,
    "repost_of_repost": extend_repost_of_a_repost,
    "save_of_repost": extend_save_of_repost,
    "save": extend_save,
    "milestone": extend_milestone,
    "remix": extend_remix,
    "cosign": extend_cosign,
    "create": extend_create,
    "tip_receive": extend_receive_tip,
    "tip_send": extend_send_tip,
    "supporting_rank_up": extend_supporter_rank_up,
    "supporter_rank_up": extend_supporter_rank_up,
    "supporter_dethroned": extend_supporter_dethroned,
    "challenge_reward": extend_challenge_reward,
    "reaction": extend_reaction,
    "tastemaker": extend_tastemaker,
    "tier_change": extend_tier_change,
    "track_added_to_playlist": extend_track_added_to_playlist,
    "trending": extend_trending,
    "trending_playlist": extend_trending_playlist,
    "trending_underground": extend_trending_underground,
    "usdc_purchase_buyer": extend_usdc_purchase_buyer,
    "usdc_purchase_seller": extend_usdc_purchase_seller,
    "announcement": extend_announcement,
}
