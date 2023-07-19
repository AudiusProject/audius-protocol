import { Knex } from 'knex'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { PlaylistRow, TrackRow, UserRow } from '../../types/dn'
import { EntityType } from '../../email/notifications/types'

type UserBasicInfo = {
  user_id: number
  name: string
  is_deactivated: boolean
}

type PlaylistInfo = {
  playlist_id: number
  playlist_name: string
  is_album: boolean
}

type TrackInfo = {
  track_id: number
  title: string
}

export abstract class BaseNotification<Type> {
  notification: Type
  dnDB: Knex
  identityDB: Knex

  constructor(dnDB: Knex, identityDB: Knex, notification: Type) {
    this.notification = notification
    this.dnDB = dnDB
    this.identityDB = identityDB
  }

  async fetchEntities(entityIds: number[], entityType: string) {
    switch (entityType) {
      case EntityType.Track: {
        const res: Array<{ track_id: number; title: string }> = await this.dnDB
          .select('track_id', 'title')
          .from<TrackRow>('tracks')
          .where('is_current', true)
          .whereIn(
            'track_id',
            entityIds.map((id) => id.toString())
          )
        return res.reduce<Record<number, TrackInfo>>(
          (acc, track) => ({
            ...acc,
            [track.track_id]: { ...track }
          }),
          {}
        )
      }
      case EntityType.Album:
      case EntityType.Playlist: {
        const res: Array<{
          playlist_id: number
          playlist_name: string
          is_album: boolean
        }> = await this.dnDB
          .select('playlist_id', 'playlist_name', 'is_album')
          .from<PlaylistRow>('playlists')
          .where('is_current', true)
          .whereIn(
            'playlist_id',
            entityIds.map((id) => id.toString())
          )
        return res.reduce<Record<number, PlaylistInfo>>(
          (acc, playlist) => ({
            ...acc,
            [playlist.playlist_id]: { ...playlist }
          }),
          {}
        )
      }
      default:
        console.error(`Fetching entity type ${entityType} not supported`)
    }
  }

  async getUsersBasicInfo(userIds: Array<number>) {
    const res: Array<{
      user_id: number
      name: string
      is_deactivated: boolean
    }> = await this.dnDB
      .select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn(
        'user_id',
        userIds.map((id) => id.toString())
      )
    return res.reduce<Record<number, UserBasicInfo>>(
      (acc, user) => ({
        ...acc,
        [user.user_id]: { ...user }
      }),
      {}
    )
  }

  async incrementBadgeCount(userId: number) {
    await this.identityDB('PushNotificationBadgeCounts')
      .insert({
        userId,
        iosBadgeCount: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflict('userId')
      .merge({
        iosBadgeCount: this.identityDB.raw('?? + ?', [
          'PushNotificationBadgeCounts.iosBadgeCount',
          1
        ]),
        updatedAt: new Date()
      })
  }

  async processNotification(params: {
    isLiveEmailEnabled: boolean
    isBrowserPushEnabled: boolean
  }) {
    // handles live processing of notification. this includes: mobile push, browser push, and live emails
    return
  }

  getNotificationTimestamp() {
    const timestamp = Math.floor(
      Date.parse((this.notification as any).timestamp as string) / 1000
    )
    return timestamp
  }

  getResourcesForEmail(): ResourceIds {
    return {}
  }

  formatEmailProps(
    resources: Resources,
    additionalNotifications?: BaseNotification<Type>[]
  ) {
    return {}
  }
}
