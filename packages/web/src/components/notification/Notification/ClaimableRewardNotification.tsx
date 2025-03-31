import { useCallback } from 'react'

import { ClaimableRewardNotification as ClaimableRewardNotificationType } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { Button, Flex, IconTokenGold } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { push } from 'utils/navigation'

import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'

const { REWARDS_PAGE } = route

const messages = {
  title: 'Rewards Ready to Claim',
  claimableReward: 'You have $AUDIO rewards ready to claim!',
  claimYourRewards: 'Claim Your Rewards'
}

type ClaimableRewardNotificationProps = {
  notification: ClaimableRewardNotificationType
}

export const ClaimableRewardNotification = (
  props: ClaimableRewardNotificationProps
) => {
  const { notification } = props
  const { timeLabel, isViewed } = notification
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    dispatch(push(REWARDS_PAGE))
  }, [dispatch])

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTokenGold size='2xl' />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>{messages.claimableReward}</NotificationBody>
      <Flex mt='l'>
        <Button size='small' onClick={handleClick}>
          {messages.claimYourRewards}
        </Button>
      </Flex>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
