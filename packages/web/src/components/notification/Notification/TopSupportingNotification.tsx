import { ReactComponent as IconTrending } from 'assets/img/iconTrending.svg'
import { SupportingRankUp } from 'common/store/notifications/types'

import styles from './TopSupportingNotification.module.css'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { ProfilePicture } from './components/ProfilePicture'
import { TwitterShareButton } from './components/TwitterShareButton'
import { UserNameLink } from './components/UserNameLink'
import { IconTip } from './components/icons'

const messages = {
  title: 'Top Supporter',
  supporterChange: "You're now their",
  supporter: 'Top Supporter'
}

type TopSupportingNotificationProps = {
  notification: SupportingRankUp
}

export const TopSupportingNotification = (
  props: TopSupportingNotificationProps
) => {
  const { notification } = props
  const { user, rank, timeLabel, isViewed } = notification

  return (
    <NotificationTile notification={notification}>
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
      <TwitterShareButton />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
