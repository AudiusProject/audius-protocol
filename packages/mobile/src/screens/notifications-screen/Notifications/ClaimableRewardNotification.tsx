import { useCallback } from 'react'

import type { ClaimableRewardNotification as ClaimableRewardNotificationType } from '@audius/common/store'

import { Button, IconTokenGold } from '@audius/harmony-native'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle
} from '../Notification'
import { makeStyles } from 'app/styles'
import { useNavigation } from 'app/hooks/useNavigation'

const messages = {
  title: 'Rewards Ready to Claim',
  claimableReward: 'You have $AUDIO rewards ready to claim!',
  claimYourRewards: 'Claim Your Rewards'
}

const useStyles = makeStyles(({ spacing }) => ({
  claimYourRewardsButton: {
    marginTop: spacing(4),
    alignSelf: 'flex-start'
  }
}))

type ClaimableRewardNotificationProps = {
  notification: ClaimableRewardNotificationType
}

export const ClaimableRewardNotification = (
  props: ClaimableRewardNotificationProps
) => {
  const { notification } = props
  const navigation = useNavigation()
  const styles = useStyles()

  const handlePress = useCallback(() => {
    navigation.navigate('AudioScreen')
  }, [navigation, notification])

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={IconTokenGold}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>{messages.claimableReward}</NotificationText>
      <Button
        size='small'
        style={styles.claimYourRewardsButton}
        onPress={handlePress}
      >
        {messages.claimYourRewards}
      </Button>
    </NotificationTile>
  )
}
