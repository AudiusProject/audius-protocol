import { ID, Remix, Track } from '@audius/common/models'
import {
  accountSelectors,
  NotificationType,
  Entity,
  Achievement,
  reactionsUIActions,
  Notification
} from '@audius/common/store'
import { waitForAccount, waitForRead } from '@audius/common/utils'
import moment from 'moment'
import { all, call, put, select } from 'typed-redux-saga'

import { retrieveCollections } from '../cache/collections/utils'
import { retrieveTracks } from '../cache/tracks/utils'
import { fetchUsers } from '../cache/users/sagas'

const { fetchReactionValues } = reactionsUIActions
const { getUserId } = accountSelectors

// The initial user count to load in for each notification
// NOTE: the rest are loading in in the user list modal
export const USER_INITIAL_LOAD_COUNT = 9

const getTimeAgo = (now: moment.Moment, date: number) => {
  const notifDate = moment.unix(date)
  const weeksAgo = now.diff(notifDate, 'weeks')
  if (weeksAgo) return `${weeksAgo} Week${weeksAgo > 1 ? 's' : ''} ago`
  const daysAgo = now.diff(notifDate, 'days')
  if (daysAgo) return `${daysAgo} Day${daysAgo > 1 ? 's' : ''} ago`
  const hoursAgo = now.diff(notifDate, 'hours')
  if (hoursAgo) return `${hoursAgo} Hour${hoursAgo > 1 ? 's' : ''} ago`
  const minutesAgo = now.diff(notifDate, 'minutes')
  if (minutesAgo) return `${minutesAgo} Minute${minutesAgo > 1 ? 's' : ''} ago`
  return 'A few moments ago'
}

export function* parseAndProcessNotifications(
  notifications: Notification[]
): Generator<any, Notification[], any> {
  yield* waitForRead()
  /**
   * Parse through the notifications & collect user /track / collection IDs
   * that the notification references to fetch
   */
  let trackIdsToFetch = new Set<ID>()
  let collectionIdsToFetch = new Set<ID>()
  let userIdsToFetch = new Set<ID>()
  const reactionSignatureToFetch = new Set<string>()

  notifications.forEach((notification) => {
    const { type } = notification
    if (type === NotificationType.UserSubscription) {
      if (notification.entityType === Entity.Track) {
        trackIdsToFetch = new Set([
          ...trackIdsToFetch,
          ...notification.entityIds
        ])
      } else if (
        notification.entityType === Entity.Playlist ||
        notification.entityType === Entity.Album
      ) {
        collectionIdsToFetch = new Set([
          ...collectionIdsToFetch,
          ...notification.entityIds
        ])
      }
      userIdsToFetch = new Set([...userIdsToFetch, notification.userId])
    }
    if (
      type === NotificationType.Repost ||
      type === NotificationType.RepostOfRepost ||
      type === NotificationType.Favorite ||
      type === NotificationType.FavoriteOfRepost ||
      (type === NotificationType.Milestone && 'entityType' in notification)
    ) {
      if (notification.entityType === Entity.Track) {
        trackIdsToFetch.add(notification.entityId)
      } else if (
        notification.entityType === Entity.Playlist ||
        notification.entityType === Entity.Album
      ) {
        collectionIdsToFetch.add(notification.entityId)
      } else if (notification.entityType === Entity.User) {
        userIdsToFetch.add(notification.entityId)
      }
    }
    if (
      type === NotificationType.Follow ||
      type === NotificationType.Repost ||
      type === NotificationType.RepostOfRepost ||
      type === NotificationType.Favorite ||
      type === NotificationType.FavoriteOfRepost
    ) {
      userIdsToFetch = new Set([
        ...userIdsToFetch,
        ...notification.userIds.slice(0, USER_INITIAL_LOAD_COUNT)
      ])
    }
    if (type === NotificationType.RemixCreate) {
      trackIdsToFetch
        .add(notification.parentTrackId)
        .add(notification.childTrackId)
      notification.entityType = Entity.Track
    }
    if (type === NotificationType.RemixCosign) {
      trackIdsToFetch.add(notification.childTrackId)
      userIdsToFetch.add(notification.parentTrackUserId)
      notification.entityType = Entity.Track
      notification.entityIds = [notification.childTrackId]
      notification.userId = notification.parentTrackUserId
    }
    if (
      type === NotificationType.TrendingTrack ||
      type === NotificationType.TrendingUnderground
    ) {
      trackIdsToFetch.add(notification.entityId)
    }
    if (type === NotificationType.TrendingPlaylist) {
      collectionIdsToFetch.add(notification.entityId)
    }
    if (
      type === NotificationType.TipSend ||
      type === NotificationType.TipReceive ||
      type === NotificationType.SupporterRankUp ||
      type === NotificationType.SupportingRankUp ||
      type === NotificationType.Reaction
    ) {
      userIdsToFetch.add(notification.entityId)
    }
    if (type === NotificationType.TipReceive) {
      reactionSignatureToFetch.add(notification.tipTxSignature)
    }
    if (
      type === NotificationType.AddTrackToPlaylist ||
      type === NotificationType.TrackAddedToPurchasedAlbum
    ) {
      trackIdsToFetch.add(notification.trackId)
      userIdsToFetch.add(notification.playlistOwnerId)
      collectionIdsToFetch.add(notification.playlistId)
    }
    if (type === NotificationType.SupporterDethroned) {
      userIdsToFetch.add(notification.supportedUserId)
      userIdsToFetch.add(notification.entityId)
    }
    if (type === NotificationType.Tastemaker) {
      userIdsToFetch.add(notification.userId)
      trackIdsToFetch.add(notification.entityId)
    }
    if (
      type === NotificationType.USDCPurchaseBuyer ||
      type === NotificationType.USDCPurchaseSeller
    ) {
      userIdsToFetch = new Set([...userIdsToFetch, ...notification.userIds])
      if (notification.entityType === Entity.Track) {
        trackIdsToFetch.add(notification.entityId)
      } else if (notification.entityType === Entity.Album) {
        collectionIdsToFetch.add(notification.entityId)
      }
    }
    if (
      type === NotificationType.RequestManager ||
      type === NotificationType.ApproveManagerRequest
    ) {
      userIdsToFetch.add(notification.userId)
    }

    if (
      type === NotificationType.Comment ||
      type === NotificationType.CommentThread ||
      type === NotificationType.CommentMention
    ) {
      if (notification.entityType === Entity.Track) {
        trackIdsToFetch.add(notification.entityId)
      }
      userIdsToFetch = new Set([...userIdsToFetch, ...notification.userIds])
    }
  })

  const [tracks] = yield* all([
    call(retrieveTracks, { trackIds: Array.from(trackIdsToFetch) }),
    call(retrieveCollections, Array.from(collectionIdsToFetch)),
    call(
      fetchUsers,
      Array.from(userIdsToFetch), // userIds
      undefined, // requiredFields
      false // forceRetrieveFromSource
    ),
    reactionSignatureToFetch.size
      ? put(
          fetchReactionValues({
            entityIds: Array.from(reactionSignatureToFetch)
          })
        )
      : () => {}
  ])

  /**
   * For Milestone and Followers, update the notification entityId as the userId
   * For Remix Create, add the userId as the track owner id of the fetched child track
   * Attach a `timeLabel` to each notification as well to be displayed ie. 2 Hours Ago
   */
  const now = moment()
  yield* waitForAccount()
  const userId = yield* select(getUserId)
  if (!userId) return []
  const remixTrackParents: Array<ID> = []
  const processedNotifications = notifications.map((notif) => {
    if (
      notif.type === NotificationType.Milestone &&
      notif.achievement === Achievement.Followers
    ) {
      notif.entityId = userId
    } else if (notif.type === NotificationType.RemixCreate) {
      const childTrack = (tracks as Track[]).find(
        (track) => track.track_id === notif.childTrackId
      )
      if (childTrack) {
        notif.userId = childTrack.owner_id
      }
    } else if (notif.type === NotificationType.RemixCosign) {
      const childTrack = (tracks as Track[]).find(
        (track) => track.track_id === notif.childTrackId
      )
      if (childTrack && childTrack.remix_of) {
        const parentTrackIds = childTrack.remix_of.tracks.map(
          (t: Remix) => t.parent_track_id
        )
        remixTrackParents.push(...parentTrackIds)
        notif.entityIds.push(...parentTrackIds)
      }
    }
    notif.timeLabel = getTimeAgo(now, notif.timestamp)
    return notif
  })
  if (remixTrackParents.length > 0)
    yield* call(retrieveTracks, { trackIds: remixTrackParents })
  return processedNotifications
}
