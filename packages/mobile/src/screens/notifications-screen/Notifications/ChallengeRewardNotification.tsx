import type { ChallengeRewardNotification as ChallengeRewardNotificationType } from '@audius/common/store'

import { useCallback } from 'react'

import type { ChallengeRewardID } from '@audius/common/models'
import { Platform } from 'react-native'

import IconAudius from 'app/assets/images/iconAudius.svg'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle,
  NotificationTwitterButton
} from '../Notification'

const messages = {
  amountEarned: (amount: number) => `You've earned ${amount} $AUDIO`,
  referredText:
    ' for being referred! Invite your friends to join to earn more!',
  challengeCompleteText: ' for completing this challenge!',
  twitterShareText:
    'I earned $AUDIO for completing challenges on @audius #AudioRewards'
}

const challengeInfoMap: Partial<
  Record<
    ChallengeRewardID,
    { title: string; amount: number; iosTitle?: string }
  >
> = {
  'profile-completion': {
    title: '✅️ Complete Your Profile',
    amount: 1
  },
  'listen-streak': {
    title: '🎧 Listening Streak: 7 Days',
    amount: 1
  },
  'track-upload': {
    title: '🎶 Upload 3 Tracks',
    amount: 1
  },
  referrals: {
    title: '📨 Invite Your Friends',
    amount: 1
  },
  'ref-v': {
    title: '📨 Invite Your Fans',
    amount: 1
  },
  referred: {
    title: '📨 Invite Your Friends',
    amount: 1
  },
  'connect-verified': {
    title: '✅️ Link Verified Accounts',
    amount: 5
  },
  'mobile-install': {
    title: '📲 Get the App',
    amount: 1
  },
  'send-first-tip': {
    title: '🤑 Send Your First Tip',
    // NOTE: Send tip -> Send $AUDIO change
    iosTitle: '🤑 Send Your First $AUDIO',
    amount: 2
  },
  'first-playlist': {
    title: '🎼 Create a Playlist',
    amount: 2
  }
}

type ChallengeRewardNotificationProps = {
  notification: ChallengeRewardNotificationType
}

export const ChallengeRewardNotification = (
  props: ChallengeRewardNotificationProps
) => {
  const { notification } = props
  const { challengeId } = notification
  const info = challengeInfoMap[challengeId]
  const navigation = useNotificationNavigation()

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  if (!info) return null
  const { title, amount, iosTitle } = info

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconAudius}>
        <NotificationTitle>
          {Platform.OS === 'ios' && iosTitle != null ? iosTitle : title}
        </NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        {messages.amountEarned(amount)}{' '}
        {challengeId === 'referred'
          ? messages.referredText
          : messages.challengeCompleteText}
      </NotificationText>
      <NotificationTwitterButton
        type='static'
        shareText={messages.twitterShareText}
      />
    </NotificationTile>
  )
}
