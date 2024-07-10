import { Knex } from 'knex'
import { email } from '../../email/notifications/preRendered/requestManager'
import { ResourceIds, Resources } from '../../email/notifications/renderEmail'
import { sendTransactionalEmail } from '../../email/notifications/sendEmail'
import { sendPushNotification } from '../../sns'
import { NotificationRow } from '../../types/dn'
import { RequestManagerNotification } from '../../types/notifications'
import { disableDeviceArns } from '../../utils/disableArnEndpoint'
import { getHostname } from '../../utils/env'
import { formatProfilePictureUrl } from '../../utils/format'
import { sendBrowserNotification } from '../../web'
import { BaseNotification } from './base'
import {
  Device,
  buildUserNotificationSettings
} from './userNotificationSettings'

type RequestManagerRow = Omit<NotificationRow, 'data'> & {
  data: RequestManagerNotification
}

const body = (managedAccountName: string): string =>
  `${managedAccountName} has invited you to manage their account.`

export class RequestManager extends BaseNotification<RequestManagerRow> {
  granteeUserId: number
  granteeAddress: string
  userId: number

  constructor(dnDB: Knex, identityDB: Knex, notification: RequestManagerRow) {
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

    const title = 'Account Management Request'

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
                type: 'RequestManager',
                entityId: this.notification.data.user_id
              }
            }
          )
        })
      )
      await disableDeviceArns(this.identityDB, pushes)
      await this.incrementBadgeCount(this.granteeUserId)
    }

    const managedAccountUser = users[this.userId]
    const managerUser = users[this.granteeUserId]
    await sendTransactionalEmail({
      email: userNotificationSettings.getUserEmail(this.granteeUserId),
      html: email({
        managedAccountHandle: managedAccountUser.handle,
        managedAccountName: managedAccountName,
        managedAccountProfilePicture:
          formatProfilePictureUrl(managedAccountUser),
        managerHandle: managerUser.handle,
        managerName: managerUser.name,
        managerProfilePicture: formatProfilePictureUrl(managerUser),
        link: `${getHostname()}/settings/accounts-you-manage?pending=${
          managedAccountUser.user_id
        }`
      }),
      subject: `Account Management Request`
    })
  }

  getResourcesForEmail(): ResourceIds {
    return {
      users: new Set([this.userId])
    }
  }

  formatEmailProps(resources: Resources) {
    const user = resources.users[this.userId]

    return {
      type: this.notification.type,
      users: [user]
    }
  }
}
