import React, { ComponentType, useCallback, useState } from 'react'

import { TipReceived } from 'common/store/notifications/types'

import { AudioText } from './AudioText'
import { NotificationBody } from './NotificationBody'
import { NotificationFooter } from './NotificationFooter'
import { NotificationHeader } from './NotificationHeader'
import { NotificationTile } from './NotificationTile'
import { NotificationTitle } from './NotificationTitle'
import { ProfilePicture } from './ProfilePicture'
import styles from './TipReceivedNotification.module.css'
import { TwitterShareButton } from './TwitterShareButton'
import { UserNameLink } from './UserNameLink'
import { IconTip } from './icons'
import { reactions, ReactionTypes, ReactionProps } from './reactions'

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
  const { user, value, timeLabel, isRead } = notification

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
      <NotificationFooter timeLabel={timeLabel} isRead={isRead} />
    </NotificationTile>
  )
}
