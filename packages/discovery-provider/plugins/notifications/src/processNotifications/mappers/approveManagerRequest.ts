import { Knex } from 'knex'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { sendPushNotification } from '../../sns'
import { NotificationRow } from '../../types/dn'
import {
  AppEmailNotification,
  ApproveManagerNotification
} from '../../types/notifications'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'
import { sendBrowserNotification } from '../../web'
import { BaseNotification } from './base'
import {
  Device,
  buildUserNotificationSettings
} from './userNotificationSettings'
import { sendNotificationEmail } from '../../email/notifications/sendEmail'

type ApproveManagerRow = Omit<NotificationRow, 'data'> & {
  data: ApproveManagerNotification
}

const body = (managerName: string): string =>
  `${managerName} has been added as a manager on your account.`

export class ApproveManagerRequest extends BaseNotification<ApproveManagerRow> {
  granteeUserId: number
  granteeAddress: string
  userId: number

  constructor(dnDB: Knex, identityDB: Knex, notification: ApproveManagerRow) {
    super(dnDB, identityDB, notification)
    this.granteeUserId = this.notification.data.grantee_user_id
    this.granteeAddress = this.notification.data.grantee_address
    this.userId = this.notification.data.user_id
  }

  async processNotification({
    isLiveEmailEnabled,
    isBrowserPushEnabled
  }: {
    isLiveEmailEnabled: boolean
    isBrowserPushEnabled: boolean
  }) {
    const users = await this.getUsersBasicInfo([
      this.granteeUserId,
      this.userId
    ])
    if (
      users?.[this.granteeUserId]?.is_deactivated ||
      users?.[this.userId]?.is_deactivated
    ) {
      return
    }

    const managerName = users[this.granteeUserId].name
    // Get the user's notification setting from identity service
    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [this.userId]
    )

    const title = 'New Account Manager Added'

    await sendBrowserNotification(
      isBrowserPushEnabled,
      userNotificationSettings,
      this.userId,
      title,
      body(managerName)
    )
    if (
      userNotificationSettings.shouldSendPushNotification({
        receiverUserId: this.userId,
        initiatorUserId: this.granteeUserId
      })
    ) {
      const devices: Device[] = userNotificationSettings.getDevices(this.userId)
      const pushes = await Promise.all(
        devices.map((device) => {
          return sendPushNotification(
            {
              type: device.type,
              badgeCount:
                userNotificationSettings.getBadgeCount(this.userId) + 1,
              targetARN: device.awsARN
            },
            {
              title,
              body: body(managerName),
              data: {
                id: `timestamp:${this.getNotificationTimestamp()}:group_id:${
                  this.notification.group_id
                }`,
                type: 'ApproveManagerRequest',
                entityId: this.notification.data.user_id
              }
            }
          )
        })
      )

      await disableDeviceArns(this.identityDB, pushes)
      await this.incrementBadgeCount(this.userId)
    }

    if (
      isLiveEmailEnabled &&
      userNotificationSettings.shouldSendEmailAtFrequency({
        initiatorUserId: this.granteeUserId,
        receiverUserId: this.userId,
        frequency: 'live'
      })
    ) {
      const notification: AppEmailNotification = {
        receiver_user_id: this.userId,
        ...this.notification
      }
      await sendNotificationEmail({
        userId: this.userId,
        email: userNotificationSettings.getUserEmail(this.userId),
        frequency: 'live',
        notifications: [notification],
        dnDb: this.dnDB,
        identityDb: this.identityDB
      })
    }
  }

  getResourcesForEmail(): ResourceIds {
    return {
      users: new Set([this.granteeUserId])
    }
  }

  formatEmailProps(resources: Resources) {
    const user = resources.users[this.granteeUserId]

    return {
      type: this.notification.type,
      users: [user]
    }
  }
}
