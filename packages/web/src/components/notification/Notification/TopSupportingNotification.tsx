import { useCallback } from 'react'

import { Name } from '@audius/common/models'
import { useUser } from '@audius/common/src/api/tan-query/users/useUser'
import { SupportingRankUpNotification } from '@audius/common/store'
import { getXShareHandle } from '@audius/common/utils'
import { IconTrending } from '@audius/harmony'

import { make } from 'common/store/analytics/actions'
import { XShareButton } from 'components/x-share-button/XShareButton'
import { env } from 'services/env'

import styles from './TopSupportingNotification.module.css'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { ProfilePicture } from './components/ProfilePicture'
import { UserNameLink } from './components/UserNameLink'
import { IconTip } from './components/icons'
import { useGoToProfile } from './useGoToProfile'

const messages = {
  title: 'Top Supporter',
  supporterChange: "You're now their",
  supporter: 'Top Supporter',
  xShare: (handle: string, rank: number) =>
    `I'm now ${handle}'s #${rank} Top Supporter on @audius $AUDIO`
}

type TopSupportingNotificationProps = {
  notification: SupportingRankUpNotification
}

export const TopSupportingNotification = (
  props: TopSupportingNotificationProps
) => {
  const { notification } = props
  const { rank, timeLabel, isViewed } = notification

  const { data: user } = useUser(notification.entityId)

  const handleClick = useGoToProfile(user)

  const handleXShare = useCallback(
    (twitterHandle: string) => {
      const shareText = messages.xShare(twitterHandle, rank)
      return {
        shareText,
        analytics: make(
          Name.NOTIFICATIONS_CLICK_SUPPORTING_RANK_UP_TWITTER_SHARE,
          { text: shareText }
        )
      }
    },
    [rank]
  )

  if (!user) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTip />}>
        <NotificationTitle>
          #{rank} {messages.title}
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <div className={styles.bodyUser}>
          <ProfilePicture className={styles.profilePicture} user={user} />
          <UserNameLink
            className={styles.userNameLink}
            user={user}
            notification={notification}
          />
        </div>
        <span className={styles.trending}>
          <IconTrending className={styles.trendingIcon} />
          {messages.supporterChange} #{rank} {messages.supporter}
        </span>
      </NotificationBody>
      <XShareButton
        type='dynamic'
        handle={user.handle}
        url={`${env.AUDIUS_URL}/${user.handle}`}
        shareData={handleXShare}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
