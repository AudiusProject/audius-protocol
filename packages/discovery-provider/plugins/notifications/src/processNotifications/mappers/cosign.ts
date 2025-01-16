import { Knex } from 'knex'
import { NotificationRow, TrackRow, UserRow } from '../../types/dn'
import {
  AppEmailNotification,
  CosignRemixNotification
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

type CosignRemixNotificationRow = Omit<NotificationRow, 'data'> & {
  data: CosignRemixNotification
}
export class CosignRemix extends BaseNotification<CosignRemixNotificationRow> {
  parentTrackUserId: number
  remixUserId: number
  parentTrackId: number
  trackId: number

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: CosignRemixNotificationRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.remixUserId = userIds[0]
    this.parentTrackUserId = parseInt(this.notification.specifier)
    this.parentTrackId = this.notification.data.parent_track_id
    this.trackId = this.notification.data.track_id
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

    if (users?.[this.remixUserId]?.isDeactivated) {
      return
    }

    const parentTrackUserName = users[this.parentTrackUserId]?.name
    const remixTrackTitle = tracks[this.trackId]?.title

    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [this.parentTrackUserId, this.remixUserId]
    )

    const title = 'New Track Co-Sign! 🔥'
    const body = `${parentTrackUserName} Co-Signed your Remix of ${remixTrackTitle}`
    await sendBrowserNotification(
      isBrowserPushEnabled,
      userNotificationSettings,
      this.remixUserId,
      title,
      body
    )

    // If the user has devices to the notification to, proceed
    if (
      userNotificationSettings.shouldSendPushNotification({
        initiatorUserId: this.parentTrackUserId,
        receiverUserId: this.remixUserId
      })
    ) {
      const devices: Device[] = userNotificationSettings.getDevices(
        this.remixUserId
      )
      const pushes = await Promise.all(
        devices.map((device) => {
          return sendPushNotification(
            {
              type: device.type,
              badgeCount:
                userNotificationSettings.getBadgeCount(this.remixUserId) + 1,
              targetARN: device.awsARN
            },
            {
              title,
              body,
              data: {
                id: `timestamp:${this.getNotificationTimestamp()}:group_id:${
                  this.notification.group_id
                }`,
                type: 'RemixCosign',
                childTrackId: this.trackId
              }
            }
          )
        })
      )
      await disableDeviceArns(this.identityDB, pushes)
      await this.incrementBadgeCount(this.remixUserId)
    }

    if (
      isLiveEmailEnabled &&
      userNotificationSettings.shouldSendEmailAtFrequency({
        receiverUserId: this.remixUserId,
        initiatorUserId: this.parentTrackUserId,
        frequency: 'live'
      })
    ) {
      const notification: AppEmailNotification = {
        receiver_user_id: this.remixUserId,
        ...this.notification
      }
      await sendNotificationEmail({
        userId: this.remixUserId,
        email: userNotificationSettings.getUserEmail(this.remixUserId),
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
      parentTracks: [resources.tracks[this.parentTrackId]],
      parentTrackUser: resources.users[this.parentTrackUserId],
      remixTrack: resources.tracks[this.trackId],
      remixUser: resources.users[this.remixUserId]
    }
  }
}
