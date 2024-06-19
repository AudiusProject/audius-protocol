import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { ClaimableRewardNotification } from '../../types/notifications'
import { BaseNotification } from './base'
import { logger } from '../../logger'
import { sendTransactionalEmail } from '../../email/notifications/sendEmail'
import { buildUserNotificationSettings } from './userNotificationSettings'
import { email } from '../../email/notifications/preRendered/claimableReward'
import { formatImageUrl, formatProfileUrl } from '../../utils/format'

type ClaimableRewardRow = Omit<NotificationRow, 'data'> & {
  data: ClaimableRewardNotification
}

export class ClaimableReward extends BaseNotification<ClaimableRewardRow> {
  userId: number
  amount: string
  receiverAccount: string
  signature: string

  constructor(dnDB: Knex, identityDB: Knex, notification: ClaimableRewardRow) {
    super(dnDB, identityDB, notification)
    try {
      const userIds = this.notification.user_ids!
      this.userId = userIds[0]
      // Change is not an absolute value and for a transfer out will always be negative
    } catch (e) {
      logger.error('Unable to initialize ClaimableReward notification', e)
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
        handle: user.handle,
        profilePicture: formatImageUrl(user.profile_picture_sizes, 150),
        profileLink: formatProfileUrl(user.handle)
      }),
      subject: 'Your Reward is Ready to Claim! 🎉'
    })
  }
}
