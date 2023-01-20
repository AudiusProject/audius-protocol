import { Knex } from 'knex'
import { BaseNotification } from './base'
import { UserRow } from '../../types/dn'
import { DMReactionNotification } from '../../types/appNotifications'
import { logger } from '../../logger'

export class MessageReactionNotification extends BaseNotification {

  receiverUserId: number
  notification: DMReactionNotification
  dnDB: Knex
  identityDB: Knex

  constructor(dnDB: Knex, identityDB: Knex, notification: DMReactionNotification) {
    super(dnDB, identityDB, notification)
    this.receiverUserId = this.notification.receiver_user_id
  }

  async pushNotification() {
    // const senderUserId = this.notification.sender_user_id

    // // Get the user's notification setting from identity service
    // const shouldSendNotification = await this.getShouldSendNotification()
    // if (!shouldSendNotification) {
    //   return
    // }


    // const res: [string, boolean] = await this.dnDB.select('name', 'is_deactivated')
    //   .from<UserRow>('user')
    //   .where({
    //     'is_current': true,
    //     'user_id': senderUserId
    //   })
    //   .first()
    // logger.info({ res })
    // const [userName, isDeactivated] = res
    // if (isDeactivated) {
    //   return
    // }
    // const title = 'Reaction'
    // const senderName = userName
    // const message = `${senderName} reacted ${this.notification.reaction} to your message: ${this.notification.message}`

    // const userDevices = this.getUserPushDevices()
    // if (userDevices[this.receiverUserId]?.length > 0) {
    //   await Promise.all(this.sendPushNotifications(userDevices, {
    //     title: title,
    //     body: message
    //   }))
    // }
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
