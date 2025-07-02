import { useCallback } from 'react'

import { useUser } from '@audius/common/api'
import type { TierChangeNotification as TierChangeNotificationType } from '@audius/common/store'
import { route } from '@audius/common/utils'

import {
  IconTokenBronze,
  IconTokenGold,
  IconTokenPlatinum,
  IconTokenSilver
} from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'
import { env } from 'app/services/env'

import {
  NotificationTile,
  NotificationHeader,
  NotificationTitle,
  NotificationText,
  NotificationXButton
} from '../Notification'

const messages = {
  unlocked: 'Tier Unlocked',
  congrats: (tierLabel: string, amount: number) =>
    `Congrats, you’ve reached ${tierLabel} Tier by having over ${amount} $AUDIO! You now have access to exclusive features & a shiny new badge by your name.`,
  xShareText: (tier: string, icon: string) =>
    `I've reached ${tier} Tier on @audius! Check out the shiny new badge next to my name ${icon} $AUDIO`
}

const tierInfoMap = {
  none: {
    icon: (props) => <IconTokenBronze size='xl' {...props} />,
    label: 'None',
    amount: 0,
    xIcon: ''
  },
  bronze: {
    icon: (props) => <IconTokenBronze size='xl' {...props} />,
    label: 'Bronze',
    amount: 10,
    xIcon: '🥉'
  },
  silver: {
    icon: (props) => <IconTokenSilver size='xl' {...props} />,
    label: 'Silver',
    amount: 100,
    xIcon: '🥈'
  },
  gold: {
    icon: (props) => <IconTokenGold size='xl' {...props} />,
    label: 'Gold',
    amount: 1000,
    xIcon: '🥇'
  },
  platinum: {
    icon: (props) => <IconTokenPlatinum size='xl' {...props} />,
    label: 'Platinum',
    amount: 10000,
    xIcon: '🥇'
  }
}

type TierChangeNotificationProps = {
  notification: TierChangeNotificationType
}

export const TierChangeNotification = (props: TierChangeNotificationProps) => {
  const { notification } = props
  const { tier, userId } = notification
  const navigation = useNotificationNavigation()
  const { data: handle } = useUser(userId, {
    select: (user) => user.handle
  })
  const { icon, label, amount, xIcon } = tierInfoMap[tier]

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  if (!handle) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={icon}>
        <NotificationTitle style={{ textTransform: 'uppercase' }}>
          {label} {messages.unlocked}
        </NotificationTitle>
      </NotificationHeader>
      <NotificationText>{messages.congrats(label, amount)}</NotificationText>
      <NotificationXButton
        type='static'
        url={`${env.AUDIUS_URL}${route.profilePage(handle)}`}
        shareText={messages.xShareText(label, xIcon)}
      />
    </NotificationTile>
  )
}
