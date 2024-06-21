import { Knex } from 'knex'
import { NotificationRow } from '../../types/dn'
import { RewardInCooldownNotification } from '../../types/notifications'
import { BaseNotification } from './base'
import { logger } from '../../logger'
import { sendTransactionalEmail } from '../../email/notifications/sendEmail'
import { buildUserNotificationSettings } from './userNotificationSettings'
import { email } from '../../email/notifications/preRendered/rewardInCooldown'
import { formatImageUrl, formatProfileUrl } from '../../utils/format'
import { ChallengeId } from '../../email/notifications/types'

type RewardInCooldownRow = Omit<NotificationRow, 'data'> & {
  data: RewardInCooldownNotification
}

const challengeMessages = {
  'send-first-tip': {
    title: 'Send Your First Tip',
    description: 'Show some love to your favorite artist by sending them a tip.'
  },
  'track-upload': {
    title: 'Upload 3 Tracks',
    description: 'Earn 1 $AUDIO for uploading 3 tracks.'
  },
  'first-playlist': {
    title: 'Create a Playlist',
    description: 'Create a playlist and add a track.'
  },
  'mobile-install': {
    title: 'Get the Mobile App',
    description:
      'Download the Audius app for iOS or Android and sign in to Earn 1 $AUDIO.'
  },
  'ref-v': {
    title: 'Link Verified Accounts',
    description: 'Link your verified social media accounts to get 5 $AUDIO.'
  },
  referrals: {
    title: 'Invite Your Friends!',
    description: 'Earn 1 $AUDIO for you and your friend.'
  },
  referred: {
    title: 'You Accepted An Invite!',
    description: 'You earned 1 $AUDIO for being invited.'
  },
  'profile-completion': {
    title: 'Complete Your Profile',
    description: 'Complete your Audius profile to earn 1 $AUDIO.'
  }
}

export class RewardInCooldown extends BaseNotification<RewardInCooldownRow> {
  userId: number
  amount: number
  challengeId: ChallengeId

  constructor(dnDB: Knex, identityDB: Knex, notification: RewardInCooldownRow) {
    super(dnDB, identityDB, notification)
    try {
      const userIds: number[] = this.notification.user_ids!
      this.userId = userIds[0]
      this.amount = this.notification.data.amount
      this.challengeId = this.notification.data.challenge_id
    } catch (e) {
      logger.error('Unable to initialize RewardInCooldown notification', e)
    }
  }

  async processNotification() {
    logger.info(`asdf processNotification`)
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
    const challengeMessage = challengeMessages[this.challengeId]
    await sendTransactionalEmail({
      email: userNotificationSettings.getUserEmail(user.user_id),
      html: email({
        name: user.name,
        handle: user.handle,
        profilePicture: formatImageUrl(user.profile_picture_sizes, 150),
        profileLink: formatProfileUrl(user.handle),
        amount: this.amount,
        challengeTitle: challengeMessage.title,
        challengeDescription: challengeMessage.description
      }),
      subject: 'Congratulations! 🏆 You’ve earned a reward! 🎉'
    })
  }
}
