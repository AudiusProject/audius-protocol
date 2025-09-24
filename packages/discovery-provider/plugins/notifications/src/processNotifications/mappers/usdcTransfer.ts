import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { USDCTransferNotification } from '../../types/notifications'
import { BaseNotification } from './base'
import { logger } from '../../logger'
import { sendTransactionalEmail } from '../../email/notifications/sendEmail'
import { buildUserNotificationSettings } from './userNotificationSettings'
import { email } from '../../email/notifications/preRendered/transfer'
import {
  formatImageUrl,
  formatProfileUrl,
  formatUSDCWeiToUSDString
} from '../../utils/format'
import { Connection, PublicKey } from '@solana/web3.js'
import { getAccount } from '@solana/spl-token'

type USDCTransferRow = Omit<NotificationRow, 'data'> & {
  data: USDCTransferNotification
}

export class USDCTransfer extends BaseNotification<USDCTransferRow> {
  userId: number
  amount: string
  userBank: string
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
      this.userBank = this.notification.data.user_bank
    } catch (e) {
      logger.error('Unable to initialize USDCTransfer notification', e)
    }
  }

  // Detect if this is a transfer between two user bank accounts
  async isInternalTransfer() {
    try {
      const rpcEndpoint = process.env.NOTIFICATIONS_SOLANA_RPC
      if (!rpcEndpoint) {
        logger.warn('SOLANA_RPC is not set')
        return false
      }

      const connection = new Connection(rpcEndpoint, 'confirmed')

      const [userBankAccount, receiverAccount] = await Promise.all([
        getAccount(connection, new PublicKey(this.userBank)),
        getAccount(connection, new PublicKey(this.receiverAccount))
      ])

      const userBankOwner = userBankAccount.owner?.toString()
      const receiverOwner = receiverAccount.owner?.toString()

      if (userBankOwner && receiverOwner) {
        return userBankOwner === receiverOwner
      }
      return false
    } catch (e) {
      logger.warn('Failed to determine internal USDC transfer', e)
      return false
    }
  }

  async processNotification() {
    const users = await this.getUsersBasicInfo([this.userId])
    const user = users[this.userId]
    if (!user) {
      logger.error(`Could not find user for notification ${this.userId}`)
      return
    }
    if (await this.isInternalTransfer()) {
      logger.info(
        `Skipping internal USDC transfer from ${this.userBank} to ${this.receiverAccount}`
      )
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
        handle: user.handle,
        profilePicture: formatImageUrl(user.profile_picture_sizes, 150),
        profileLink: formatProfileUrl(user.handle),
        amount: this.amount,
        wallet: this.receiverAccount,
        signature: this.signature
      }),
      subject: 'Your USDC Transfer is Complete!'
    })
  }
}
