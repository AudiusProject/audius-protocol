import { useCallback } from 'react'

import {
  notificationsSelectors,
  ReactionNotification,
  getReactionFromRawValue
} from '@audius/common'
import { useUIAudio } from '@audius/common/hooks'
import { Name } from '@audius/common/models'

import { make } from 'common/store/analytics/actions'
import { useSelector } from 'utils/reducer'

import styles from './TipReactionNotification.module.css'
import { AudioText } from './components/AudioText'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { ProfilePicture } from './components/ProfilePicture'
import { reactionMap } from './components/Reaction'
import { TwitterShareButton } from './components/TwitterShareButton'
import { UserNameLink } from './components/UserNameLink'
import { IconTip } from './components/icons'
import { useGoToProfile } from './useGoToProfile'
const { getNotificationUser } = notificationsSelectors

const messages = {
  reacted: 'reacted',
  react: 'reacted to your tip of ',
  twitterShare: (handle: string) =>
    `I got a thanks from ${handle} for tipping them $AUDIO on @audius! #Audius #AUDIOTip`
}

type TipReactionNotificationProps = {
  notification: ReactionNotification
}

export const TipReactionNotification = (
  props: TipReactionNotificationProps
) => {
  const { notification } = props
  const {
    reactionValue,
    timeLabel,
    isViewed,
    reactedToEntity: { amount }
  } = notification

  const uiAmount = useUIAudio(amount)

  const user = useSelector((state) => getNotificationUser(state, notification))
  const handleClick = useGoToProfile(user)

  const handleShare = useCallback((twitterHandle: string) => {
    const shareText = messages.twitterShare(twitterHandle)
    const analytics = make(
      Name.NOTIFICATIONS_CLICK_TIP_REACTION_TWITTER_SHARE,
      { text: shareText }
    )
    return { shareText, analytics }
  }, [])

  if (!user) return null

  const userLinkElement = (
    <UserNameLink
      className={styles.profileLink}
      user={user}
      notification={notification}
    />
  )

  const reactionType = getReactionFromRawValue(reactionValue)
  if (!reactionType) return null
  const Reaction = reactionMap[reactionType]

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTip />}>
        <NotificationTitle>
          {userLinkElement} {messages.reacted}
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <div className={styles.reactionRoot}>
          <Reaction />
          <ProfilePicture
            className={styles.profilePicture}
            user={user}
            disablePopover
          />
        </div>
        <div className={styles.reactionTextRoot}>
          <div>
            {userLinkElement} {messages.react}
            <AudioText value={uiAmount} />
          </div>
        </div>
      </NotificationBody>
      <TwitterShareButton
        type='dynamic'
        handle={user.handle}
        shareData={handleShare}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
