import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { sendBrowserNotification } from '../../web'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'

// Type for the notification row
export type ArtistRemixContestSubmissionsRow = Omit<NotificationRow, 'data'> & {
  data: {
    entityId: number
    eventId: number
    milestone: number
  }
}

export class ArtistRemixContestSubmissions extends BaseNotification<ArtistRemixContestSubmissionsRow> {
  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: ArtistRemixContestSubmissionsRow
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

    const { milestone, eventId, entityId } = this.notification.data

    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      userIds
    )
    const title = 'New Remix Submission!'
    let body = ''
    if (milestone === 1) {
      body = `Your remix contest for ${trackName} received its first submission!`
    } else {
      body = `Your remix contest for ${trackName} has received ${milestone} submissions!`
    }

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
                  type: 'ArtistRemixContestSubmissions',
                  entityId,
                  eventId,
                  milestone
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
