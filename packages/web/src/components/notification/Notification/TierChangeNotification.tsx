import { useCurrentAccountUser } from '@audius/common/api'
import {
  badgeTiers,
  TierChangeNotification as TierChangeNotificationType,
  BadgeTierInfo
} from '@audius/common/store'
import { getXShareHandle } from '@audius/common/utils'
import { capitalize } from 'lodash'

import { audioTierMap } from 'components/user-badges/UserBadges'
import { XShareButton } from 'components/x-share-button/XShareButton'
import { fullProfilePage } from 'utils/route'

import styles from './TierChangeNotification.module.css'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { IconTier } from './components/icons'

const messages = {
  unlocked: 'tier unlocked',
  reached: "Congrats, you've reached ",
  having: 'Tier by having over',
  audio: '$AUDIO!',
  audioLabel: 'audio tokens',
  accessInfo:
    'You now have access to exclusive features & a shiny new badge by your name.',
  xShareText: (label: string, icon: string) =>
    `I've reached ${label} Tier on @audius! Check out the shiny new badge next to my name ${icon} $AUDIO`
}

const tierInfoMap = {
  none: { label: 'None', icon: '', amount: 0 },
  bronze: { label: 'Bronze', icon: '🥉', amount: 10 },
  silver: { label: 'Silver', icon: '🥈', amount: 100 },
  gold: { label: 'Gold', icon: '🥇', amount: 1000 },
  platinum: { label: 'Platinum', icon: '🥇', amount: 10000 }
}

type TierChangeNotificationProps = {
  notification: TierChangeNotificationType
}

export const TierChangeNotification = (props: TierChangeNotificationProps) => {
  const { notification } = props

  const { tier, timeLabel, isViewed } = notification
  const { data: user } = useCurrentAccountUser()

  const tierInfo = badgeTiers.find(
    (info) => info.tier === tier
  ) as BadgeTierInfo

  const { humanReadableAmount } = tierInfo

  const { label, icon } = tierInfoMap[tier]
  const shareText = messages.xShareText(label, icon)

  if (!user) return null

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={<IconTier>{audioTierMap[tier]}</IconTier>}>
        <NotificationTitle className={styles.title}>
          {tier} {messages.unlocked}
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        {messages.reached} {capitalize(tier)} {messages.having}{' '}
        {humanReadableAmount} {messages.audio} {messages.accessInfo}
      </NotificationBody>
      <XShareButton
        type='static'
        url={fullProfilePage(getXShareHandle(user).replace('@', ''))}
        shareText={shareText}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
