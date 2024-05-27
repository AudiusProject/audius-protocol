import { Knex } from 'knex'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { sendPushNotification } from '../../sns'
import { NotificationRow } from '../../types/dn'
import { ApproveManagerNotification } from '../../types/notifications'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'
import { sendBrowserNotification } from '../../web'
import { BaseNotification } from './base'
import {
  Device,
  buildUserNotificationSettings
} from './userNotificationSettings'

type ApproveManagerRow = Omit<NotificationRow, 'data'> & {
  data: ApproveManagerNotification
}

const body = (managedAccountName: string): string =>
  `${managedAccountName} has been added as a manager on your account.`

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

    const managedAccountName = users[this.userId].name
    // Get the user's notification setting from identity service
    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [this.granteeUserId]
    )

    const title = 'New Account Manager Added'

    await sendBrowserNotification(
      isBrowserPushEnabled,
      userNotificationSettings,
      this.granteeUserId,
      title,
      body(managedAccountName)
    )
    if (
      userNotificationSettings.shouldSendPushNotification({
        receiverUserId: this.granteeUserId,
        initiatorUserId: this.userId
      })
    ) {
      const devices: Device[] = userNotificationSettings.getDevices(
        this.granteeUserId
      )
      const pushes = await Promise.all(
        devices.map((device) => {
          return sendPushNotification(
            {
              type: device.type,
              badgeCount:
                userNotificationSettings.getBadgeCount(this.granteeUserId) + 1,
              targetARN: device.awsARN
            },
            {
              title,
              body: body(managedAccountName),
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
      await this.incrementBadgeCount(this.granteeUserId)
    }
  }

  getResourcesForEmail(): ResourceIds {
    return {
      users: new Set([this.userId])
    }
  }

  formatEmailProps(resources: Resources) {
    return {
      type: this.notification.type,
      users: resources.users
    }
  }
}
