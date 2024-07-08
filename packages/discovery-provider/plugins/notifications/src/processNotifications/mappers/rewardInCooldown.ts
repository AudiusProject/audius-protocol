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
    description:
      'Show some love to your favorite artist by sending them a tip.',
    imageUrl: 'Ky4Qr1byW9wnawVFUbRlpTaLf8d4n0.png'
  },
  'track-upload': {
    title: 'Upload 3 Tracks',
    description: 'Earn 1 $AUDIO for uploading 3 tracks.',
    imageUrl: '72WyVN4Vds7CvNZr5yQA912GLFhDOs.png'
  },
  'first-playlist': {
    title: 'Create a Playlist',
    description: 'Create a playlist and add a track.',
    imageUrl: 'PH1vcT5H8RRADIqSZwaKvNztiiKIDm.png'
  },
  'ref-v': {
    title: 'Link Verified Accounts',
    description: 'Link your verified social media accounts to get 5 $AUDIO.',
    imageUrl: 'XFmTX9RIkyTzsEEsQopzDdGXeGnxXA.png'
  },
  referrals: {
    title: 'Invite Your Friends!',
    description: 'Earn 1 $AUDIO for you and your friend.',
    imageUrl: 'XFmTX9RIkyTzsEEsQopzDdGXeGnxXA.png'
  },
  referred: {
    title: 'You Accepted An Invite!',
    description: 'You earned 1 $AUDIO for being invited.',
    imageUrl: 'XFmTX9RIkyTzsEEsQopzDdGXeGnxXA.png'
  },
  'connect-verified': {
    title: 'Link Verified Accounts',
    description: 'Link your verified social media accounts to earn 5 $AUDIO.',
    imageUrl: 'bpwwTf7HiZxlMd1PkX82qw45tiEpXX.png'
  },
  'profile-completion': {
    title: 'Complete Your Profile',
    description: 'Complete your Audius profile to earn 1 $AUDIO.',
    imageUrl: '8JCdZg2rcQdqovWtNYfUA3RZDAiyX3.png'
  },
  'listen-streak': {
    title: 'Listening Streak: 7 Days',
    description: 'Complete your Audius profile to earn 1 $AUDIO.',
    imageUrl: '8JCdZg2rcQdqovWtNYfUA3RZDAiyX3.png'
  },
  'mobile-install': {
    title: 'Get the Audius Mobile App',
    description:
      'Download the Audius app for iOS or Android and sign in to Earn 1 $AUDIO.',
    imageUrl: 'uVztPmheWeIzdv2C4vnvgBgnH221sU.png'
  },
  s: {
    title: 'Sell to Earn',
    description:
      'Receive 1 additional $AUDIO for each dollar earned from sales',
    imageUrl: 'AXu4i3Zj3QCGifxQ5ug5z8Pp8am9mS.png'
  },
  b: {
    title: 'Spend to Earn',
    description: 'Earn 1 $AUDIO for each dollar you spend on Audius.',
    imageUrl: 'AXu4i3Zj3QCGifxQ5ug5z8Pp8am9mS.png'
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
        challengeDescription: challengeMessage.description,
        challengeImage: challengeMessage.imageUrl
      }),
      subject: 'Congratulations! 🏆 You’ve earned a reward!'
    })
  }
}
