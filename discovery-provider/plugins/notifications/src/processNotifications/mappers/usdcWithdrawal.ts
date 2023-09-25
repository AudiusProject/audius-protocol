import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { USDCWithdrawalNotification } from "../../types/notifications"
import { BaseNotification } from "./base"

type USDCWithdrawalRow = Omit<NotificationRow, 'data'> & {
  data: USDCWithdrawalNotification
}

export class USDCWIthdrawal extends BaseNotification<USDCWithdrawalRow> {
  userId: number
  amount: number
  receiverAccount: string
  signature: string

  constructor(
    dnDB: Knex,
    identityDB: Knex,
    notification: USDCWithdrawalRow
  ) {
    super(dnDB, identityDB, notification)
    const userIds: number[] = this.notification.user_ids!
    this.userId = userIds[0]
    // Change is not an absolute value and for a transfer out will always be negative
    this.amount = -1 * this.notification.data.change
    this.receiverAccount = this.notification.data.receiver_account
    this.signature = this.notification.data.signature
  }

  async processNotification() {
    const users = await this.getUsersBasicInfo([
      this.userId
    ])
    console.log(users)
  }
}