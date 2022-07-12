import { useCallback } from 'react'

import { useUIAudio } from 'common/hooks/useUIAudio'
import { Name } from 'common/models/Analytics'
import { Reaction } from 'common/store/notifications/types'
import { getReactionFromRawValue } from 'common/store/ui/reactions/slice'
import { make } from 'store/analytics/actions'

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

const messages = {
  reacted: 'reacted',
  react: 'reacted to your tip of ',
  twitterShare: (handle: string) =>
    `I got a thanks from ${handle} for tipping them $AUDIO on @audiusproject! #Audius #AUDIOTip`
}

type TipReactionNotificationProps = {
  notification: Reaction
}

export const TipReactionNotification = (
  props: TipReactionNotificationProps
) => {
  const { notification } = props
  const {
    user,
    reactionValue,
    timeLabel,
    isViewed,
    reactedToEntity: { amount }
  } = notification

  const uiAmount = useUIAudio(amount)

  const handleClick = useGoToProfile(user)

  const handleShare = useCallback((twitterHandle: string) => {
    const shareText = messages.twitterShare(twitterHandle)
    const analytics = make(
      Name.NOTIFICATIONS_CLICK_TIP_REACTION_TWITTER_SHARE,
      { text: shareText }
    )
    return { shareText, analytics }
  }, [])

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
