import { Knex } from 'knex'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { PlaylistRow, TrackRow, UserRow } from '../../types/dn'
import { EntityType } from '../../email/notifications/types'

export type UserBasicInfo = {
  user_id: number
  name: string
  handle: string
  is_deactivated: boolean
  profile_picture_sizes?: string | null
  profile_picture?: string | null
}

type PlaylistInfo = {
  playlist_id: number
  playlist_name: string
  is_album: boolean
  playlist_image_sizes_multihash?: string
  slug: string
}

type TrackInfo = {
  track_id: number
  title: string
  slug: string
  cover_art_sizes?: string
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
        const res: Array<{
          track_id: number
          title: string
          cover_art_sizes?: string
          slug: string
        }> = await this.dnDB
          .select(
            'tracks.track_id',
            'tracks.title',
            'tracks.cover_art_sizes',
            'track_routes.slug'
          )
          .from<TrackRow>('tracks')
          .join('track_routes', 'tracks.track_id', 'track_routes.track_id')
          .whereIn(
            'tracks.track_id',
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
          playlist_image_sizes_multihash?: string
          slug: string
        }> = await this.dnDB
          .select(
            'playlists.playlist_id',
            'playlists.playlist_name',
            'playlists.is_album',
            'playlists.playlist_image_sizes_multihash',
            'playlist_routes.slug'
          )
          .from<PlaylistRow>('playlists')
          .join(
            'playlist_routes',
            'playlists.playlist_id',
            'playlist_routes.playlist_id'
          )
          .whereIn(
            'playlists.playlist_id',
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
      handle: string
      is_deactivated: boolean
      profile_picture?: string | null
      profile_picture_sizes?: string | null
    }> = await this.dnDB
      .select(
        'user_id',
        'name',
        'handle',
        'is_deactivated',
        'profile_picture',
        'profile_picture_sizes'
      )
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
    getIsPushNotificationEnabled: (type: string) => boolean
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
