import { Knex } from 'knex'
import { NotificationRow, UserRow } from '../../types/dn'
import { BaseNotification } from './base'
import { logger } from '../../logger'

export class FollowNotification extends BaseNotification {

  receiverUserId: number

  constructor(dnDB: Knex, identityDB: Knex, notification: NotificationRow) {
    super(dnDB, identityDB, notification)
    const userIds = this.notification.user_ids!
    const followeeUserId = userIds[0]
    this.receiverUserId = followeeUserId
  }

  async pushNotification() {
    const userIds = this.notification.user_ids!
    const followeeUserId = userIds[0]

    // Get the user's notification setting from identity service
    const shouldSendNotification = await this.getShouldSendNotification()
    if (!shouldSendNotification) {
      return
    }


    const res: [string, boolean] = await this.dnDB.select('name', 'is_deactivated')
      .from<UserRow>('user')
      .where({
        'is_current': true,
        'user_id': followeeUserId
      })
      .first()
    logger.info({ res })
    const [userName, isDeactivated] = res
    if (isDeactivated) {
      return
    }
    const title = 'Follow'
    const followerName = userName
    const message = `${followerName} followed you`

    const userDevices = this.getUserPushDevices()
    if (userDevices[this.receiverUserId]?.length > 0) {
      await Promise.all(this.sendPushNotifications(userDevices, {
        title: 'Follow',
        body: `${followerName} followed you`
      }))
    }
  }

  async getUserPushDevices() {
    // TODO:
    // 1. Fetch the user's notification settings & devices
    // 2. Verify that the follow setting is on and there is a device to send to
    // 3. Validate the user is not abusive

    // Should return dict of user-id to list of devices to send to
    return {
      [this.receiverUserId]: [
        { deviceType: '', deviceToken: '', awsARN: '' },
      ]
    }
  }

}