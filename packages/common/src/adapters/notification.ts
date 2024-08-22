import { full } from '@audius/sdk'

import type { BadgeTier, ID } from '~/models'
import type { ChallengeRewardID } from '~/models/AudioRewards'
import type { StringUSDC, StringWei } from '~/models/Wallet'
import {
  Achievement,
  Entity,
  NotificationType,
  type Notification
} from '~/store/notifications/types'
import { decodeHashId } from '~/utils/hashIds'
import { removeNullable } from '~/utils/typeUtils'

function formatBaseNotification(notification: full.Notification) {
  const timestamp = notification.actions[0].timestamp
  return {
    groupId: notification.groupId,
    timestamp,
    isViewed: !!notification.seenAt,
    id: `timestamp:${timestamp}:group_id:${notification.groupId}`
  }
}

function getDiscoveryEntityType({
  type,
  is_album
}: {
  type: string
  is_album?: boolean
}) {
  if (type === 'track') {
    return Entity.Track
  } else if (is_album === true) {
    return Entity.Album
  }
  return Entity.Playlist
}

export const notificationFromSDK = (
  notification: full.Notification
): Notification => {
  if (notification.type === 'follow') {
    const userIds = notification.actions
      .map((action) => {
        const data = action.data
        return decodeHashId(data.followerUserId)
      })
      .filter(removeNullable)
    return {
      type: NotificationType.Follow,
      userIds,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'repost') {
    let entityId = 0
    let entityType = Entity.Track
    const userIds = notification.actions
      .map((action) => {
        const data = action.data
        entityId = decodeHashId(data.repostItemId) as number
        entityType = getDiscoveryEntityType(data)
        return decodeHashId(data.userId)
      })
      .filter(removeNullable)
    return {
      type: NotificationType.Repost,
      userIds,
      entityId,
      entityType,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'save') {
    let entityId = 0
    let entityType = Entity.Track
    const userIds = notification.actions
      .map((action) => {
        const data = action.data
        entityId = decodeHashId(data.saveItemId) as number
        entityType = getDiscoveryEntityType(data)
        return decodeHashId(data.userId)
      })
      .filter(removeNullable)
    return {
      type: NotificationType.Favorite,
      userIds,
      entityId,
      entityType,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'tip_send') {
    const data = notification.actions[0].data
    const amount = data.amount
    const receiverUserId = decodeHashId(data.receiverUserId) as number
    return {
      type: NotificationType.TipSend,
      entityId: receiverUserId,
      entityType: Entity.User,
      amount: amount!.toString() as StringWei,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'tip_receive') {
    const data = notification.actions[0].data
    const amount = data.amount
    const senderUserId = decodeHashId(data.senderUserId) as number
    return {
      type: NotificationType.TipReceive,
      entityId: senderUserId,
      amount: amount!.toString() as StringWei,
      entityType: Entity.User,
      tipTxSignature: data.tipTxSignature,
      reactionValue: data.reactionValue,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'track_added_to_purchased_album') {
    let trackId = 0
    let playlistId = 0
    let playlistOwnerId = 0
    notification.actions.filter(removeNullable).forEach((action) => {
      const { data } = action
      if (data.trackId && data.playlistId && data.playlistOwnerId) {
        trackId = decodeHashId(data.trackId) as ID
        playlistId = decodeHashId(data.playlistId) as ID
        playlistOwnerId = decodeHashId(data.playlistOwnerId) as ID
      }
    })
    return {
      type: NotificationType.TrackAddedToPurchasedAlbum,
      trackId,
      playlistId,
      playlistOwnerId,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'track_added_to_playlist') {
    let trackId = 0
    let playlistId = 0
    let playlistOwnerId = 0
    notification.actions.filter(removeNullable).forEach((action) => {
      const { data } = action
      if (data.trackId && data.playlistId && data.playlistOwnerId) {
        trackId = decodeHashId(data.trackId) as ID
        playlistId = decodeHashId(data.playlistId) as ID
        playlistOwnerId = decodeHashId(data.playlistOwnerId) as ID
      }
    })
    return {
      type: NotificationType.AddTrackToPlaylist,
      trackId,
      playlistId,
      playlistOwnerId,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'tastemaker') {
    const data = notification.actions[0].data
    return {
      type: NotificationType.Tastemaker,
      entityType: Entity.Track,
      entityId: decodeHashId(data.tastemakerItemId) as number,
      userId: decodeHashId(data.tastemakerItemOwnerId) as number, // owner of the tastemaker track
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'supporter_rank_up') {
    const data = notification.actions[0].data
    const senderUserId = decodeHashId(data.senderUserId) as number
    return {
      type: NotificationType.SupporterRankUp,
      entityId: senderUserId,
      rank: data.rank,
      entityType: Entity.User,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'supporting_rank_up') {
    const data = notification.actions[0].data
    const receiverUserId = decodeHashId(data.receiverUserId) as number
    return {
      type: NotificationType.SupportingRankUp,
      entityId: receiverUserId,
      rank: data.rank,
      entityType: Entity.User,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'supporter_dethroned') {
    const data = notification.actions[0].data
    return {
      type: NotificationType.SupporterDethroned,
      entityType: Entity.User,
      entityId: decodeHashId(data.senderUserId) as number,
      supportedUserId: decodeHashId(data.receiverUserId) as number,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'challenge_reward') {
    const data = notification.actions[0].data
    const challengeId = data.challengeId as ChallengeRewardID
    return {
      type: NotificationType.ChallengeReward,
      challengeId,
      entityType: Entity.User,
      amount: data.amount as StringWei,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'claimable_reward') {
    const data = notification.actions[0].data
    const challengeId = data.challengeId as ChallengeRewardID
    return {
      type: NotificationType.ClaimableReward,
      challengeId,
      entityType: Entity.User,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'tier_change') {
    const data = notification.actions[0].data
    const tier = data.newTier as BadgeTier
    const userId = decodeHashId(notification.actions[0].specifier) as number
    return {
      type: NotificationType.TierChange,
      tier,
      userId,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'create') {
    let entityType: Entity = Entity.Track
    const entityIds = notification.actions
      .map((action) => {
        const data = action.data
        if (full.instanceOfCreatePlaylistNotificationActionData(data)) {
          entityType = data.isAlbum ? Entity.Album : Entity.Playlist
          // Future proofing for when playlistId is fixed to be a string
          return decodeHashId(
            Array.isArray(data.playlistId)
              ? data.playlistId[0]!
              : data.playlistId
          )
        }
        entityType = Entity.Track
        return decodeHashId(data.trackId)
      })
      .flat()
      .filter(removeNullable)
    // playlist owner ids are the specifier of the playlist create notif
    const userId =
      entityType === Entity.Track
        ? // track create notifs store track owner id in the group id
          parseInt(notification.groupId.split(':')[3])
        : // album/playlist create notifications store album owner
          // id as the specifier
          (decodeHashId(notification.actions[0].specifier) as number)
    return {
      type: NotificationType.UserSubscription,
      userId,
      entityIds,
      entityType,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'remix') {
    let childTrackId = 0
    let parentTrackId = 0
    let trackOwnerId = 0
    notification.actions.forEach((action) => {
      const data = action.data
      childTrackId = decodeHashId(data.trackId) as number
      parentTrackId = decodeHashId(data.parentTrackId) as number
      trackOwnerId = decodeHashId(data.trackOwnerId) as number
    })
    return {
      type: NotificationType.RemixCreate,
      entityType: Entity.Track,
      parentTrackId,
      childTrackId,
      userId: trackOwnerId,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'cosign') {
    const data = notification.actions[0].data
    const entityType = Entity.Track
    const entityIds = [decodeHashId(data.parentTrackId) as number]
    const childTrackId = decodeHashId(data.trackId) as number
    const parentTrackUserId = decodeHashId(
      notification.actions[0].specifier
    ) as number
    const userId = decodeHashId(data.trackOwnerId) as number

    return {
      type: NotificationType.RemixCosign,
      userId,
      entityType,
      entityIds,
      parentTrackUserId,
      childTrackId,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'trending_playlist') {
    const data = notification.actions[0].data

    return {
      type: NotificationType.TrendingPlaylist,
      rank: data.rank,
      genre: data.genre,
      time: data.timeRange,
      entityType: Entity.Playlist,
      entityId: decodeHashId(data.playlistId) as number,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'trending') {
    const data = notification.actions[0].data

    return {
      type: NotificationType.TrendingTrack,
      rank: data.rank,
      genre: data.genre,
      time: data.timeRange,
      entityType: Entity.Track,
      entityId: decodeHashId(data.trackId) as number,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'trending_underground') {
    const data = notification.actions[0].data

    return {
      type: NotificationType.TrendingUnderground,
      rank: data.rank,
      genre: data.genre,
      time: data.timeRange,
      entityType: Entity.Track,
      entityId: decodeHashId(data.trackId) as number,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'milestone') {
    const data = notification.actions[0].data
    if (full.instanceOfTrackMilestoneNotificationActionData(data)) {
      let achievement: Achievement
      if (data.type === 'track_repost_count') {
        achievement = Achievement.Reposts
      } else if (data.type === 'track_save_count') {
        achievement = Achievement.Favorites
      } else {
        achievement = Achievement.Listens
      }
      return {
        type: NotificationType.Milestone,
        entityType: Entity.Track,
        entityId: decodeHashId(data.trackId) as number,
        value: data.threshold,
        achievement,
        ...formatBaseNotification(notification)
      }
    } else if (full.instanceOfPlaylistMilestoneNotificationActionData(data)) {
      let achievement: Achievement
      if (data.type === 'playlist_repost_count') {
        achievement = Achievement.Reposts
      } else {
        achievement = Achievement.Favorites
      }
      return {
        type: NotificationType.Milestone,
        entityType: data.isAlbum ? Entity.Album : Entity.Playlist,
        entityId: decodeHashId(data.playlistId) as number,
        value: data.threshold,
        achievement,
        ...formatBaseNotification(notification)
      }
    } else {
      return {
        type: NotificationType.Milestone,
        entityType: Entity.User,
        entityId: decodeHashId(data.userId) as number,
        achievement: Achievement.Followers,
        value: data.threshold,
        ...formatBaseNotification(notification)
      }
    }
  } else if (notification.type === 'announcement') {
    const data = notification.actions[0].data

    return {
      type: NotificationType.Announcement,
      title: data.title,
      shortDescription: data.shortDescription,
      longDescription: data.longDescription,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'reaction') {
    const data = notification.actions[0].data
    return {
      type: NotificationType.Reaction,
      entityId: decodeHashId(data.receiverUserId) as number,
      entityType: Entity.User,
      reactionValue: data.reactionValue,
      reactionType: data.reactionType,
      reactedToEntity: {
        tx_signature: data.reactedTo,
        amount: data.tipAmount as StringWei,
        tip_sender_id: decodeHashId(data.senderUserId) as number
      },
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'repost_of_repost') {
    let entityId = 0
    let entityType = Entity.Track
    const userIds = notification.actions
      .map((action) => {
        const data = action.data
        entityId = decodeHashId(data.repostOfRepostItemId) as number
        entityType = getDiscoveryEntityType(data)
        return decodeHashId(data.userId)
      })
      .filter(removeNullable)
    return {
      type: NotificationType.RepostOfRepost,
      userIds,
      entityId,
      entityType,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'save_of_repost') {
    let entityId = 0
    let entityType = Entity.Track
    const userIds = notification.actions
      .map((action) => {
        const data = action.data
        entityId = decodeHashId(data.saveOfRepostItemId) as number
        entityType = getDiscoveryEntityType(data)
        return decodeHashId(data.userId)
      })
      .filter(removeNullable)
    return {
      type: NotificationType.FavoriteOfRepost,
      userIds,
      entityId,
      entityType,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'usdc_purchase_seller') {
    let entityId = 0
    let entityType = Entity.Track
    let amount = '' as StringUSDC
    let extraAmount = '' as StringUSDC
    const userIds = notification.actions
      .map((action) => {
        const data = action.data
        entityId = decodeHashId(data.contentId) as number
        entityType = data.contentType === 'track' ? Entity.Track : Entity.Album
        amount = data.amount as StringUSDC
        extraAmount = data.extraAmount as StringUSDC
        return decodeHashId(data.buyerUserId)
      })
      .filter(removeNullable)
    return {
      type: NotificationType.USDCPurchaseSeller,
      userIds,
      entityId,
      entityType,
      amount,
      extraAmount,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'usdc_purchase_buyer') {
    let entityId = 0
    let entityType = Entity.Track
    const userIds = notification.actions
      .map((action) => {
        const data = action.data
        entityId = decodeHashId(data.contentId) as number
        entityType = data.contentType === 'track' ? Entity.Track : Entity.Album
        return decodeHashId(data.sellerUserId)
      })
      .filter(removeNullable)
    return {
      type: NotificationType.USDCPurchaseBuyer,
      userIds,
      entityId,
      entityType,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'request_manager') {
    const data = notification.actions[0].data

    return {
      type: NotificationType.RequestManager,
      userId: decodeHashId(data.userId)!,
      ...formatBaseNotification(notification)
    }
  } else if (notification.type === 'approve_manager_request') {
    const data = notification.actions[0].data

    return {
      type: NotificationType.ApproveManagerRequest,
      userId: decodeHashId(data.granteeUserId)!,
      ...formatBaseNotification(notification)
    }
  } else {
    console.error('Notification does not match an expected type.')
  }

  return notification
}
