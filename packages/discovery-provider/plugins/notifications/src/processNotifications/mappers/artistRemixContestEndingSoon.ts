import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { ArtistRemixContestEndingSoonNotification } from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { sendBrowserNotification } from '../../web'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'

export type ArtistRemixContestEndingSoonRow = Omit<NotificationRow, 'data'> & {
  data: ArtistRemixContestEndingSoonNotification
}

export class ArtistRemixContestEndingSoon extends BaseNotification<ArtistRemixContestEndingSoonRow> {
  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: ArtistRemixContestEndingSoonRow
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
    const title = 'Remix Contest'
    const body = `Your remix contest for ${trackName} is ending in 48 hours!`

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
                  type: 'ArtistRemixContestEndingSoon',
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
