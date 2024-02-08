import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { USDCTransferNotification } from '../../types/notifications'
import { BaseNotification } from './base'
import { logger } from '../../logger'
import { sendTransactionalEmail } from '../../email/notifications/sendEmail'
import { buildUserNotificationSettings } from './userNotificationSettings'
import { email } from '../../email/notifications/preRendered/transfer'
import { formatUSDCWeiToUSDString } from '../../utils/format'

type USDCTransferRow = Omit<NotificationRow, 'data'> & {
  data: USDCTransferNotification
}

export class USDCTransfer extends BaseNotification<USDCTransferRow> {
  userId: number
  amount: string
  receiverAccount: string
  signature: string

  constructor(dnDB: Knex, identityDB: Knex, notification: USDCTransferRow) {
    super(dnDB, identityDB, notification)
    try {
      const userIds: number[] = this.notification.user_ids!
      this.userId = userIds[0]
      // Change is not an absolute value and for a transfer out will always be negative
      this.amount = formatUSDCWeiToUSDString(
        (-1 * this.notification.data.change).toString()
      )
      this.receiverAccount = this.notification.data.receiver_account
      this.signature = this.notification.data.signature
    } catch (e) {
      logger.error('Unable to initialize USDCTransfer notification', e)
    }
  }

  async processNotification() {
    const users = await this.getUsersBasicInfo([this.userId])
    const user = users[this.userId]
    if (!user) {
      logger.error(`Could not find user for notification ${this.userId}`)
      return
    }
    // Get the user's notification setting from identity service
    const userNotificationSettings = await buildUserNotificationSettings(
      this.identityDB,
      [user.user_id]
    )
    await sendTransactionalEmail({
      email: userNotificationSettings.getUserEmail(user.user_id),
      html: email({
        name: user.name,
        amount: this.amount,
        wallet: this.receiverAccount,
        signature: this.signature
      }),
      subject: 'Your Transfer Has Been Started'
    })
  }
}
