import { useCallback } from 'react'

import {
  ChallengeRewardNotification as ChallengeRewardNotificationType,
  audioRewardsPageSelectors
} from '@audius/common'
import { Name } from '@audius/common/models'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { make, useRecord } from 'common/store/analytics/actions'
import { getChallengeConfig } from 'pages/audio-rewards-page/config'
import { AUDIO_PAGE } from 'utils/route'

import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { TwitterShareButton } from './components/TwitterShareButton'
import { IconRewards } from './components/icons'

const { getUserChallenge } = audioRewardsPageSelectors

const messages = {
  amountEarned: (amount: number) => `You've earned ${amount} $AUDIO`,
  referredText:
    ' for being referred! Invite your friends to join to earn more!',
  challengeCompleteText: ' for completing this challenge!',
  body: (amount: number) =>
    `You've earned ${amount} $AUDIO for completing this challenge!`,
  twitterShareText:
    'I earned $AUDIO for completing challenges on @audius #AudioRewards'
}

type ChallengeRewardNotificationProps = {
  notification: ChallengeRewardNotificationType
}

export const ChallengeRewardNotification = (
  props: ChallengeRewardNotificationProps
) => {
  const { notification } = props
  const { challengeId, timeLabel, isViewed, type } = notification
  const dispatch = useDispatch()
  const record = useRecord()

  const { title, icon } = getChallengeConfig(challengeId)
  const { amount } = useSelector((state) =>
    getUserChallenge(state, { challengeId })
  )

  const handleClick = useCallback(() => {
    dispatch(push(AUDIO_PAGE))
    record(
      make(Name.NOTIFICATIONS_CLICK_TILE, { kind: type, link_to: AUDIO_PAGE })
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
      <TwitterShareButton type='static' shareText={messages.twitterShareText} />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
