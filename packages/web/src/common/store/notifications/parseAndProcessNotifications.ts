import {
  ID,
  waitForRead,
  Notification,
  NotificationType,
  Entity,
  reactionsUIActions,
  waitForAccount,
  Track,
  Achievement,
  Remix,
  accountSelectors
} from '@audius/common'
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
  const trackIdsToFetch: ID[] = []
  const collectionIdsToFetch: ID[] = []
  const userIdsToFetch: ID[] = []
  const reactionSignatureToFetch: string[] = []

  notifications.forEach((notification) => {
    const { type } = notification
    if (type === NotificationType.UserSubscription) {
      if (notification.entityType === Entity.Track) {
        notification.entityIds = [...new Set(notification.entityIds)]
        trackIdsToFetch.push(...notification.entityIds)
      } else if (
        notification.entityType === Entity.Playlist ||
        notification.entityType === Entity.Album
      ) {
        notification.entityIds = [...new Set(notification.entityIds)]
        collectionIdsToFetch.push(...notification.entityIds)
      }
      userIdsToFetch.push(notification.userId)
    }
    if (
      type === NotificationType.Repost ||
      type === NotificationType.RepostOfRepost ||
      type === NotificationType.Favorite ||
      type === NotificationType.FavoriteOfRepost ||
      (type === NotificationType.Milestone && 'entityType' in notification)
    ) {
      if (notification.entityType === Entity.Track) {
        trackIdsToFetch.push(notification.entityId)
      } else if (
        notification.entityType === Entity.Playlist ||
        notification.entityType === Entity.Album
      ) {
        collectionIdsToFetch.push(notification.entityId)
      } else if (notification.entityType === Entity.User) {
        userIdsToFetch.push(notification.entityId)
      }
    }
    if (
      type === NotificationType.Follow ||
      type === NotificationType.Repost ||
      type === NotificationType.RepostOfRepost ||
      type === NotificationType.Favorite ||
      type === NotificationType.FavoriteOfRepost
    ) {
      notification.userIds = [...new Set(notification.userIds)]
      userIdsToFetch.push(
        ...notification.userIds.slice(0, USER_INITIAL_LOAD_COUNT)
      )
    }
    if (type === NotificationType.RemixCreate) {
      trackIdsToFetch.push(
        notification.parentTrackId,
        notification.childTrackId
      )
      notification.entityType = Entity.Track
    }
    if (type === NotificationType.RemixCosign) {
      trackIdsToFetch.push(notification.childTrackId)
      userIdsToFetch.push(notification.parentTrackUserId)
      notification.entityType = Entity.Track
      notification.entityIds = [notification.childTrackId]
      notification.userId = notification.parentTrackUserId
    }
    if (
      type === NotificationType.TrendingTrack ||
      type === NotificationType.TrendingUnderground
    ) {
      trackIdsToFetch.push(notification.entityId)
    }
    if (type === NotificationType.TrendingPlaylist) {
      collectionIdsToFetch.push(notification.entityId)
    }
    if (
      type === NotificationType.TipSend ||
      type === NotificationType.TipReceive ||
      type === NotificationType.SupporterRankUp ||
      type === NotificationType.SupportingRankUp ||
      type === NotificationType.Reaction
    ) {
      userIdsToFetch.push(notification.entityId)
    }
    if (type === NotificationType.TipReceive) {
      reactionSignatureToFetch.push(notification.tipTxSignature)
    }
    if (type === NotificationType.AddTrackToPlaylist) {
      trackIdsToFetch.push(notification.trackId)
      userIdsToFetch.push(notification.playlistOwnerId)
      collectionIdsToFetch.push(notification.playlistId)
    }
    if (type === NotificationType.SupporterDethroned) {
      userIdsToFetch.push(notification.supportedUserId)
      userIdsToFetch.push(notification.entityId)
    }
    if (type === NotificationType.Tastemaker) {
      userIdsToFetch.push(notification.userId)
      trackIdsToFetch.push(notification.entityId)
    }
  })

  const [tracks] = yield* all([
    call(retrieveTracks, { trackIds: trackIdsToFetch }),
    call(retrieveCollections, collectionIdsToFetch),
    call(
      fetchUsers,
      userIdsToFetch, // userIds
      undefined, // requiredFields
      false // forceRetrieveFromSource
    ),
    reactionSignatureToFetch.length
      ? put(fetchReactionValues({ entityIds: reactionSignatureToFetch }))
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
