import { useCallback } from 'react'

import type { BNAudio } from '@audius/common/models'
import type { ChallengeRewardNotification as ChallengeRewardNotificationType } from '@audius/common/store'
import {
  challengeRewardsConfig,
  stringWeiToAudioBN
} from '@audius/common/utils'
import { Platform } from 'react-native'

import { IconAudiusLogo } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle,
  NotificationTwitterButton
} from '../Notification'

const messages = {
  amountEarned: (amount: BNAudio) => `You've earned ${amount} $AUDIO`,
  referredText:
    ' for being referred! Invite your friends to join to earn more!',
  challengeCompleteText: ' for completing this challenge!',
  twitterShareText:
    'I earned $AUDIO for completing challenges on @audius #AudioRewards'
}

type ChallengeRewardNotificationProps = {
  notification: ChallengeRewardNotificationType
}

const trendingChallengeIdMapping = {
  tt: 'trending-track',
  tp: 'trending-playlist',
  tut: 'trending-underground-track'
}

export const ChallengeRewardNotification = (
  props: ChallengeRewardNotificationProps
) => {
  const { notification } = props
  const { challengeId } = notification
  const mappedChallengeRewardsConfigKey =
    challengeId in trendingChallengeIdMapping
      ? trendingChallengeIdMapping[challengeId]
      : challengeId

  const info = challengeRewardsConfig[mappedChallengeRewardsConfigKey]
  const amount = stringWeiToAudioBN(notification.amount)
  const navigation = useNotificationNavigation()

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  if (!info) return null
  const { title } = info
  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconAudiusLogo}>
        <NotificationTitle>
          {Platform.OS === 'ios' && title.includes('Tip')
            ? title.replace('Tip', '$AUDIO')
            : title}
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
