import { TierChange } from 'audius-client/src/common/store/notifications/types'

import IconBronzeBadge from 'app/assets/images/IconBronzeBadge.svg'
import IconGoldBadge from 'app/assets/images/IconGoldBadge.svg'
import IconPlatinumBadge from 'app/assets/images/IconPlatinumBadge.svg'
import IconSilverBadge from 'app/assets/images/IconSilverBadge.svg'

import {
  NotificationTile,
  NotificationHeader,
  NotificationTitle,
  NotificationText
} from '../Notification'

const messages = {
  unlocked: 'Tier Unlocked',
  congrats: (tierLabel: string, amount: number) =>
    `Congrats, you’ve reached ${tierLabel} Tier by having over ${amount} $AUDIO! You now have access to exclusive features & a shiny new badge by your name.`
}

const tierInfoMap = {
  none: {
    icon: IconBronzeBadge,
    label: 'None',
    amount: 0
  },
  bronze: {
    icon: IconBronzeBadge,
    label: 'Bronze',
    amount: 10
  },
  silver: {
    icon: IconSilverBadge,
    label: 'Silver',
    amount: 100
  },
  gold: {
    icon: IconGoldBadge,
    label: 'Gold',
    amount: 10000
  },
  platinum: {
    icon: IconPlatinumBadge,
    label: 'Platinum',
    amount: 100000
  }
}

type TierChangeNotificationProps = {
  notification: TierChange
}

export const TierChangeNotification = (props: TierChangeNotificationProps) => {
  const { notification } = props
  const { tier } = notification

  const { icon, label, amount } = tierInfoMap[tier]

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={icon}>
        <NotificationTitle style={{ textTransform: 'uppercase' }}>
          {label} {messages.unlocked}
        </NotificationTitle>
      </NotificationHeader>
      <NotificationText>{messages.congrats(label, amount)}</NotificationText>
    </NotificationTile>
  )
}
