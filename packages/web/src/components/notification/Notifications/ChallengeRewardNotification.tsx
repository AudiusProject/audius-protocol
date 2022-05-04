import React from 'react'

import { ChallengeReward } from 'common/store/notifications/types'
import { challengeRewardsConfig } from 'pages/audio-rewards-page/config'

import { NotificationBody } from './NotificationBody'
import { NotificationFooter } from './NotificationFooter'
import { NotificationHeader } from './NotificationHeader'
import { NotificationTile } from './NotificationTile'
import { NotificationTitle } from './NotificationTitle'
import { TwitterShareButton } from './TwitterShareButton'
import { IconRewards } from './icons'

const messages = {
  body: (amount: number) =>
    `You've earned ${amount} $AUDIO for completing this challenge!`
}

type ChallengeRewardNotificationProps = {
  notification: ChallengeReward
}

export const ChallengeRewardNotification = (
  props: ChallengeRewardNotificationProps
) => {
  const { notification } = props
  const { challengeId, timeLabel, isRead } = notification

  const { amount: rewardAmount, title, icon } = challengeRewardsConfig[
    challengeId
  ]

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={<IconRewards>{icon}</IconRewards>}>
        <NotificationTitle>{title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>{messages.body(rewardAmount)}</NotificationBody>
      <TwitterShareButton />
      <NotificationFooter timeLabel={timeLabel} isRead={isRead} />
    </NotificationTile>
  )
}
