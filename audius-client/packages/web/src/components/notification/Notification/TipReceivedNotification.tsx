import React, { ComponentType, useCallback, useState } from 'react'

import { TipReceived } from 'common/store/notifications/types'

import styles from './TipReceivedNotification.module.css'
import { AudioText } from './components/AudioText'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { ProfilePicture } from './components/ProfilePicture'
import { reactions, ReactionTypes, ReactionProps } from './components/Reaction'
import { TwitterShareButton } from './components/TwitterShareButton'
import { UserNameLink } from './components/UserNameLink'
import { IconTip } from './components/icons'

const reactionTypes = Object.keys(reactions) as ReactionTypes[]
const reactionList = reactionTypes.map<
  [ReactionTypes, ComponentType<ReactionProps>]
>(reaction => [reaction, reactions[reaction]])

const messages = {
  title: 'You Received a Tip!',
  sent: 'sent you a tip of',
  audio: '$AUDIO',
  sayThanks: 'Say Thanks With a Reaction',
  reactionSent: 'Reaction Sent!'
}

type TipReceivedNotificationProps = {
  notification: TipReceived
}

export const TipReceivedNotification = (
  props: TipReceivedNotificationProps
) => {
  const [isTileDisabled, setIsTileDisabled] = useState(false)
  const [activeReaction, setActiveReaction] = useState<ReactionTypes | null>(
    null
  )
  const { notification } = props
  const { user, value, timeLabel, isViewed } = notification

  const handleMouseEnter = useCallback(() => setIsTileDisabled(true), [])
  const handleMouseLeave = useCallback(() => setIsTileDisabled(false), [])

  return (
    <NotificationTile
      notification={notification}
      disabled={isTileDisabled}
      disableClosePanel
    >
      <NotificationHeader icon={<IconTip />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <div className={styles.bodyText}>
          <ProfilePicture className={styles.profilePicture} user={user} />
          <span>
            <UserNameLink user={user} notification={notification} />{' '}
            {messages.sent} <AudioText value={value} />
          </span>
        </div>
        <div className={styles.sayThanks}>
          {activeReaction ? (
            <>
              <i className='emoji small white-heavy-check-mark' />{' '}
              {messages.reactionSent}{' '}
            </>
          ) : (
            messages.sayThanks
          )}
        </div>
        <div
          className={styles.reactionList}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {reactionList.map(([reactionType, Reaction]) => (
            <Reaction
              key={reactionType}
              onClick={() => setActiveReaction(reactionType)}
              isActive={
                activeReaction === null
                  ? undefined
                  : reactionType === activeReaction
              }
              isResponsive
            />
          ))}
        </div>
      </NotificationBody>
      <TwitterShareButton />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
