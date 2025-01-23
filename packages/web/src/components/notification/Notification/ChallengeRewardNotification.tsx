import { useCallback } from 'react'

import { Name, BNAudio, ChallengeRewardID } from '@audius/common/models'
import { ChallengeRewardNotification as ChallengeRewardNotificationType } from '@audius/common/store'
import { route, stringWeiToAudioBN } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { make, useRecord } from 'common/store/analytics/actions'
import { getChallengeConfig } from 'pages/audio-rewards-page/config'
import { env } from 'services/env'
import { push } from 'utils/navigation'

import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { TwitterShareButton } from './components/TwitterShareButton'
import { IconRewards } from './components/icons'

const { REWARDS_PAGE } = route

const messages = {
  amountEarned: (amount: BNAudio) => `You've earned ${amount} $AUDIO`,
  referredText:
    ' for being referred! Invite your friends to join to earn more!',
  challengeCompleteText: ' for completing this challenge!',
  body: (amount: number) =>
    `You've earned ${amount} $AUDIO for completing this challenge!`,
  twitterShareText:
    'I earned $AUDIO for completing challenges on @audius #Audius #AudioRewards'
}

type ChallengeRewardNotificationProps = {
  notification: ChallengeRewardNotificationType
}

const trendingChallengeIdMapping: {
  [key in ChallengeRewardID]?: ChallengeRewardID
} = {
  tt: 'trending-track',
  tp: 'trending-playlist',
  tut: 'trending-underground'
}

export const ChallengeRewardNotification = (
  props: ChallengeRewardNotificationProps
) => {
  const { notification } = props
  const { challengeId, timeLabel, isViewed, type } = notification
  const dispatch = useDispatch()
  const record = useRecord()
  const mappedChallengeRewardsConfigKey =
    trendingChallengeIdMapping[challengeId] ?? challengeId

  const { title, icon } = getChallengeConfig(mappedChallengeRewardsConfigKey)
  const amount = stringWeiToAudioBN(notification.amount)
  const handleClick = useCallback(() => {
    dispatch(push(REWARDS_PAGE))
    record(
      make(Name.NOTIFICATIONS_CLICK_TILE, { kind: type, link_to: REWARDS_PAGE })
    )
  }, [dispatch, record, type])

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconRewards>{icon}</IconRewards>}>
        <NotificationTitle>{title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        {messages.amountEarned(amount)}
        {challengeId === 'referred'
          ? messages.referredText
          : messages.challengeCompleteText}
      </NotificationBody>
      <TwitterShareButton
        type='static'
        url={env.AUDIUS_URL}
        shareText={messages.twitterShareText}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
