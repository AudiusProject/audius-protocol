import { useCallback } from 'react'

import type { TierChangeNotification as TierChangeNotificationType } from '@audius/common'
import { cacheUsersSelectors } from '@audius/common'
import { fullProfilePage } from 'audius-client/src/utils/route'
import { useSelector } from 'react-redux'

import {
  IconTokenBronze,
  IconTokenGold,
  IconTokenPlatinum,
  IconTokenSilver
} from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationTile,
  NotificationHeader,
  NotificationTitle,
  NotificationText,
  NotificationTwitterButton
} from '../Notification'
const { getUser } = cacheUsersSelectors

const messages = {
  unlocked: 'Tier Unlocked',
  congrats: (tierLabel: string, amount: number) =>
    `Congrats, you’ve reached ${tierLabel} Tier by having over ${amount} $AUDIO! You now have access to exclusive features & a shiny new badge by your name.`,
  twitterShareText: (tier: string, icon: string) =>
    `I've reached ${tier} Tier on @audius! Check out the shiny new badge next to my name ${icon}`
}

const tierInfoMap = {
  none: {
    icon: IconTokenBronze,
    label: 'None',
    amount: 0,
    twitterIcon: ''
  },
  bronze: {
    icon: IconTokenBronze,
    label: 'Bronze',
    amount: 10,
    twitterIcon: '🥉'
  },
  silver: {
    icon: IconTokenSilver,
    label: 'Silver',
    amount: 100,
    twitterIcon: '🥈'
  },
  gold: {
    icon: IconTokenGold,
    label: 'Gold',
    amount: 10000,
    twitterIcon: '🥇'
  },
  platinum: {
    icon: IconTokenPlatinum,
    label: 'Platinum',
    amount: 100000,
    twitterIcon: '🥇'
  }
}

type TierChangeNotificationProps = {
  notification: TierChangeNotificationType
}

export const TierChangeNotification = (props: TierChangeNotificationProps) => {
  const { notification } = props
  const { tier, userId } = notification
  const navigation = useNotificationNavigation()
  const user = useSelector((state) => getUser(state, { id: userId }))
  const { icon, label, amount, twitterIcon } = tierInfoMap[tier]

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  if (!user) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={icon}>
        <NotificationTitle style={{ textTransform: 'uppercase' }}>
          {label} {messages.unlocked}
        </NotificationTitle>
      </NotificationHeader>
      <NotificationText>{messages.congrats(label, amount)}</NotificationText>
      <NotificationTwitterButton
        type='static'
        url={fullProfilePage(user.handle)}
        shareText={messages.twitterShareText(label, twitterIcon)}
      />
    </NotificationTile>
  )
}
