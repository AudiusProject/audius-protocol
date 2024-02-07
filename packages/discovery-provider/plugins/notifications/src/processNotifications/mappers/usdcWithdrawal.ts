import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { USDCWithdrawalNotification } from '../../types/notifications'
import { BaseNotification } from './base'
import { logger } from './../../logger'
import { sendTransactionalEmail } from '../../email/notifications/sendEmail'
import { buildUserNotificationSettings } from './userNotificationSettings'
import { email } from '../../email/notifications/preRendered/withdrawal'
import { formatUSDCWeiToUSDString } from '../../utils/format'

type USDCWithdrawalRow = Omit<NotificationRow, 'data'> & {
  data: USDCWithdrawalNotification
}

export class USDCWithdrawal extends BaseNotification<USDCWithdrawalRow> {
  userId: number
  amount: string
  receiverAccount: string
  signature: string

  constructor(dnDB: Knex, identityDB: Knex, notification: USDCWithdrawalRow) {
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
      logger.error('Unable to initialize USDCWithdrawal notification', e)
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
        amount: this.amount
      }),
      subject: 'Your Withdrawal Has Been Started'
    })
  }
}
