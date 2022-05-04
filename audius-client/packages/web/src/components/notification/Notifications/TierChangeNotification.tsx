import React from 'react'

import { TierChange } from 'common/store/notifications/types'
import { BadgeTierInfo, badgeTiers } from 'common/store/wallet/utils'
import { audioTierMapPng } from 'components/user-badges/UserBadges'

import { NotificationBody } from './NotificationBody'
import { NotificationFooter } from './NotificationFooter'
import { NotificationHeader } from './NotificationHeader'
import { NotificationTile } from './NotificationTile'
import { NotificationTitle } from './NotificationTitle'
import styles from './TierChangeNotification.module.css'
import { IconTier } from './icons'

const messages = {
  unlocked: 'tier unlocked',
  reached: "Congrats, you've reached ",
  having: 'Tier by having over',
  audio: '$AUDIO!',
  audioLabel: 'audio tokens',
  accessInfo:
    'You now have access to exclusive features & a shiny new badge by your name.'
}

type TierChangeNotificationProps = {
  notification: TierChange
}

export const TierChangeNotification = (props: TierChangeNotificationProps) => {
  const { notification } = props

  const { tier: tierValue, timeLabel, isRead } = notification

  const tierInfo = badgeTiers.find(
    info => info.tier === tierValue
  ) as BadgeTierInfo

  const { tier, humanReadableAmount } = tierInfo

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={<IconTier>{audioTierMapPng[tier]}</IconTier>}>
        <NotificationTitle className={styles.title}>
          {tier} {messages.unlocked}
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        {messages.reached} {tier} {messages.having} {humanReadableAmount}{' '}
        {messages.audio} {messages.accessInfo}
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isRead={isRead} />
    </NotificationTile>
  )
}
