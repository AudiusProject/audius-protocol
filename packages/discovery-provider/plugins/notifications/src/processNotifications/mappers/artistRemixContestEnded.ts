import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { ArtistRemixContestEndedNotification } from '../../types/notifications'
import { BaseNotification } from './base'
import { sendPushNotification } from '../../sns'
import {
  buildUserNotificationSettings,
  Device
} from './userNotificationSettings'
import { sendBrowserNotification } from '../../web'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'
import { formatImageUrl } from '../../utils/format'

// Type for the notification row
export type ArtistRemixContestEndedRow = Omit<NotificationRow, 'data'> & {
  data: ArtistRemixContestEndedNotification
}

export class ArtistRemixContestEnded extends BaseNotification<ArtistRemixContestEndedRow> {
  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: ArtistRemixContestEndedRow
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

    // Fetch track's cover art URL for rich notification (150x150 size)
    let imageUrl: string | undefined
    const trackRes: Array<{
      track_id: number
      title: string
      cover_art_sizes?: string | null
    }> = await this.dnDB
      .select('track_id', 'title', 'cover_art_sizes')
      .from('tracks')
      .where('is_current', true)
      .whereIn('track_id', [this.notification.data.entityId])
    const track = trackRes[0]
    if (track?.cover_art_sizes) {
      imageUrl = formatImageUrl(track.cover_art_sizes, 150)
    }

    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      userIds
    )
    const title = 'Remix Contest'
    const body =
      "Your remix contest has ended. Don't forget to contact your winners!"

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
                  id: `timestamp:${this.getNotificationTimestamp()}:group_id:${
                    this.notification.group_id
                  }`,
                  type: 'ArtistRemixContestEnded',
                  entityId: this.notification.data.entityId
                },
                imageUrl
              }
            )
          })
        )
        await disableDeviceArns(this.identityDB, pushes)
        await this.incrementBadgeCount(userId)
      } else {
        console.log(
          'DEBUG artist_remix_contest_ended: shouldSendPushNotification returned false for user',
          userId
        )
      }
    }
  }
}
