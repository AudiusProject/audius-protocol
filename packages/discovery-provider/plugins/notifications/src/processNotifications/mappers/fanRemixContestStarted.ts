import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { FanRemixContestStartedNotification } from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { sendBrowserNotification } from '../../web'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'

export type FanRemixContestStartedRow = Omit<NotificationRow, 'data'> & {
  data: FanRemixContestStartedNotification
}

export class FanRemixContestStarted extends BaseNotification<FanRemixContestStartedRow> {
  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: FanRemixContestStartedRow
  ) {
    super(dnDB, identityDB, notification)
  }

  async processNotification({
    isBrowserPushEnabled
  }: {
    isBrowserPushEnabled: boolean
  }) {
    const userIds = this.notification.user_ids ?? []
    if (!userIds.length) {
      return
    }

    // Fetch artist name
    const artistRes: Array<{ user_id: number; name: string }> = await this.dnDB
      .select('user_id', 'name')
      .from('users')
      .where('is_current', true)
      .whereIn('user_id', [this.notification.data.entityUserId])
    const artistName = artistRes[0]?.name ?? ''

    // Fetch track name
    const trackRes: Array<{ track_id: number; title: string }> = await this.dnDB
      .select('track_id', 'title')
      .from('tracks')
      .where('is_current', true)
      .whereIn('track_id', [this.notification.data.entityId])
    const trackName = trackRes[0]?.title ?? ''

    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      userIds
    )
    const title = 'New Remix Contest'
    const body = `${artistName} started a new remix contest for ${trackName}`

    for (const userId of userIds) {
      // Send browser push
      await sendBrowserNotification(
        isBrowserPushEnabled,
        userNotificationSettings,
        userId,
        title,
        body
      )

      // Send mobile push if enabled
      if (
        userNotificationSettings.shouldSendPushNotification({
          receiverUserId: userId
        })
      ) {
        const devices: Device[] = userNotificationSettings.getDevices(userId)
        const pushes = await Promise.all(
          devices.map((device) => {
            return sendPushNotification(
              {
                type: device.type,
                badgeCount: userNotificationSettings.getBadgeCount(userId) + 1,
                targetARN: device.awsARN
              },
              {
                title,
                body,
                data: {
                  id: `timestamp:${this.getNotificationTimestamp()}:group_id:${this.notification.group_id}`,
                  type: 'FanRemixContestStarted',
                  entityId: this.notification.data.entityId,
                  entityUserId: this.notification.data.entityUserId
                }
              }
            )
          })
        )
        await disableDeviceArns(this.identityDB, pushes)
        await this.incrementBadgeCount(userId)
      }
    }
  }
}
