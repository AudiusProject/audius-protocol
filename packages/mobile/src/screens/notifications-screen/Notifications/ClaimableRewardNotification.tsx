import { useCallback } from 'react'

import type { ClaimableRewardNotification as ClaimableRewardNotificationType } from '@audius/common/store'

import { Button, Flex, IconTokenGold } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle
} from '../Notification'

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
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    navigation.navigate('AudioScreen')
  }, [navigation])

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={() => <IconTokenGold size='xl' />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>{messages.claimableReward}</NotificationText>
      <Flex mt='xl' alignItems='flex-start'>
        <Button size='small' onPress={handlePress}>
          {messages.claimYourRewards}
        </Button>
      </Flex>
    </NotificationTile>
  )
}
