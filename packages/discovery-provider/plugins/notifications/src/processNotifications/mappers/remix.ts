import { Knex } from 'knex'
import { NotificationRow, TrackRow, UserRow } from '../../types/dn'
import {
  AppEmailNotification,
  RemixNotification,
  RepostNotification
} from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { sendNotificationEmail } from '../../email/notifications/sendEmail'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { sendBrowserNotification } from '../../web'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'

type RemixNotificationRow = Omit<NotificationRow, 'data'> & {
  data: RemixNotification
}
export class Remix extends BaseNotification<RemixNotificationRow> {
  parentTrackUserId: number
  remixUserId: number
  parentTrackId: number
  trackId: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: RemixNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.parentTrackUserId = userIds[0]
    this.parentTrackId = this.notification.data.parent_track_id
    this.trackId = this.notification.data.track_id
    this.remixUserId = parseInt(this.notification.specifier)
  }

  async processNotification({
    isLiveEmailEnabled,
    isBrowserPushEnabled
  }: {
    isLiveEmailEnabled: boolean
    isBrowserPushEnabled: boolean
  }) {
    const res: Array<{
      user_id: number
      name: string
      is_deactivated: boolean
    }> = await this.dnDB
      .select('user_id', 'name', 'is_deactivated')
      .from<UserRow>('users')
      .where('is_current', true)
      .whereIn('user_id', [this.remixUserId, this.parentTrackUserId])
    const users = res.reduce(
      (acc, user) => {
        acc[user.user_id] = {
          name: user.name,
          isDeactivated: user.is_deactivated
        }
        return acc
      },
      {} as Record<number, { name: string; isDeactivated: boolean }>
    )

    const trackRes: Array<{ track_id: number; title: string }> = await this.dnDB
      .select('track_id', 'title')
      .from<TrackRow>('tracks')
      .where('is_current', true)
      .whereIn('track_id', [this.trackId, this.parentTrackId])
    const tracks = trackRes.reduce(
      (acc, track) => {
        acc[track.track_id] = { title: track.title }
        return acc
      },
      {} as Record<number, { title: string }>
    )

    if (users?.[this.parentTrackUserId]?.isDeactivated) {
      return
    }

    // TODO: Fetch the remix track and parent track

    // Get the user's notification setting from identity service
    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [this.parentTrackUserId, this.remixUserId]
    )

    // TODO Fill this out
    const parentTrackTitle = tracks[this.parentTrackId]?.title
    const remixUserName = users[this.remixUserId]?.name
    const remixTitle = tracks[this.trackId]?.title

    const title = 'New Remix Of Your Track ♻️'
    const body = `New remix of your track ${parentTrackTitle}: ${remixUserName} uploaded ${remixTitle}`
    if (
      userNotificationSettings.isNotificationTypeEnabled(
        this.parentTrackUserId,
        'remixes'
      )
    ) {
      await sendBrowserNotification(
        isBrowserPushEnabled,
        userNotificationSettings,
        this.parentTrackUserId,
        title,
        body
      )
    }

    // If the user has devices to the notification to, proceed
    if (
      userNotificationSettings.shouldSendPushNotification({
        initiatorUserId: this.remixUserId,
        receiverUserId: this.parentTrackUserId
      })
    ) {
      const devices: Device[] = userNotificationSettings.getDevices(
        this.parentTrackUserId
      )
      // If the user's settings for the follow notification is set to true, proceed
      const pushes = await Promise.all(
        devices.map((device) => {
          return sendPushNotification(
            {
              type: device.type,
              badgeCount:
                userNotificationSettings.getBadgeCount(this.parentTrackUserId) +
                1,
              targetARN: device.awsARN
            },
            {
              title,
              body,
              data: {
                id: `timestamp:${this.getNotificationTimestamp()}:group_id:${
                  this.notification.group_id
                }`,
                type: 'RemixCreate',
                childTrackId: this.trackId
              }
            }
          )
        })
      )
      await disableDeviceArns(this.identityDB, pushes)
      await this.incrementBadgeCount(this.parentTrackUserId)
    }

    if (
      isLiveEmailEnabled &&
      userNotificationSettings.shouldSendEmailAtFrequency({
        initiatorUserId: this.remixUserId,
        receiverUserId: this.parentTrackUserId,
        frequency: 'live'
      })
    ) {
      const notification: AppEmailNotification = {
        receiver_user_id: this.parentTrackUserId,
        ...this.notification
      }
      await sendNotificationEmail({
        userId: this.parentTrackUserId,
        email: userNotificationSettings.getUserEmail(this.parentTrackUserId),
        frequency: 'live',
        notifications: [notification],
        dnDb: this.dnDB,
        identityDb: this.identityDB
      })
    }
  }

  getResourcesForEmail(): ResourceIds {
    return {
      users: new Set([this.parentTrackUserId, this.remixUserId]),
      tracks: new Set([this.trackId, this.parentTrackId])
    }
  }

  formatEmailProps(resources: Resources) {
    return {
      type: this.notification.type,
      parentTrack: resources.tracks[this.parentTrackId],
      parentTrackUser: resources.users[this.parentTrackUserId],
      remixTrack: resources.tracks[this.trackId],
      remixUser: resources.users[this.remixUserId]
    }
  }
}
