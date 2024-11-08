import {
  notificationsSelectors,
  badgeTiers,
  TierChangeNotification as TierChangeNotificationType,
  BadgeTierInfo
} from '@audius/common/store'

import { audioTierMapPng } from 'components/user-badges/UserBadges'
import { useSelector } from 'utils/reducer'
import { fullProfilePage } from 'utils/route'

import styles from './TierChangeNotification.module.css'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { TwitterShareButton } from './components/TwitterShareButton'
import { IconTier } from './components/icons'
import { capitalize } from 'lodash'
const { getNotificationUser } = notificationsSelectors

const messages = {
  unlocked: 'tier unlocked',
  reached: "Congrats, you've reached ",
  having: 'Tier by having over',
  audio: '$AUDIO!',
  audioLabel: 'audio tokens',
  accessInfo:
    'You now have access to exclusive features & a shiny new badge by your name.',
  twitterShareText: (label: string, icon: string) =>
    `I've reached ${label} Tier on @audius! Check out the shiny new badge next to my name ${icon} #Audius $AUDIO`
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
  const user = useSelector((state) => getNotificationUser(state, notification))

  const tierInfo = badgeTiers.find(
    (info) => info.tier === tier
  ) as BadgeTierInfo

  const { humanReadableAmount } = tierInfo

  const { label, icon } = tierInfoMap[tier]
  const shareText = messages.twitterShareText(label, icon)

  if (!user) return null

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={<IconTier>{audioTierMapPng[tier]}</IconTier>}>
        <NotificationTitle className={styles.title}>
          {tier} {messages.unlocked}
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        {messages.reached} {capitalize(tier)} {messages.having}{' '}
        {humanReadableAmount} {messages.audio} {messages.accessInfo}
      </NotificationBody>
      <TwitterShareButton
        type='static'
        url={fullProfilePage(user.handle)}
        shareText={shareText}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
