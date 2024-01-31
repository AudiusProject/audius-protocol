import {
  notificationsSelectors,
  reactionsUIActions,
  reactionsUISelectors,
  reactionOrder,
  TipReceiveNotification,
  ReactionTypes
} from '@audius/common/store'

import { ComponentType, useCallback, useState } from 'react'

import {} from '@audius/common'
import { useUIAudio } from '@audius/common/hooks'
import { Name } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { useSelector } from 'utils/reducer'

import styles from './TipReceivedNotification.module.css'
import { AudioText } from './components/AudioText'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { ProfilePicture } from './components/ProfilePicture'
import { ReactionProps, reactionMap } from './components/Reaction'
import { TwitterShareButton } from './components/TwitterShareButton'
import { UserNameLink } from './components/UserNameLink'
import { IconTip } from './components/icons'
import { useGoToProfile } from './useGoToProfile'
const { writeReactionValue } = reactionsUIActions
const { makeGetReactionForSignature } = reactionsUISelectors
const { getNotificationUser } = notificationsSelectors

const reactionList: [ReactionTypes, ComponentType<ReactionProps>][] =
  reactionOrder.map((r) => [r, reactionMap[r]])

const messages = {
  title: 'You Received a Tip!',
  sent: 'sent you a tip of',
  audio: '$AUDIO',
  sayThanks: 'Say Thanks With a Reaction',
  reactionSent: 'Reaction Sent!',
  twitterShare: (senderHandle: string, amount: number) =>
    `Thanks ${senderHandle} for the ${amount} $AUDIO tip on @audius! #Audius #AUDIOTip`
}

type TipReceivedNotificationProps = {
  notification: TipReceiveNotification
}

const useSetReaction = (tipTxSignature: string) => {
  const dispatch = useDispatch()

  const setReactionValue = useCallback(
    (reaction: Nullable<ReactionTypes>) => {
      dispatch(writeReactionValue({ reaction, entityId: tipTxSignature }))
    },
    [tipTxSignature, dispatch]
  )
  return setReactionValue
}

export const TipReceivedNotification = (
  props: TipReceivedNotificationProps
) => {
  const [isTileDisabled, setIsTileDisabled] = useState(false)
  const { notification } = props
  const { amount, timeLabel, isViewed, tipTxSignature } = notification

  const user = useSelector((state) => getNotificationUser(state, notification))

  const reactionValue = useSelector(makeGetReactionForSignature(tipTxSignature))
  const setReaction = useSetReaction(tipTxSignature)

  const uiAmount = useUIAudio(amount)

  const handleClick = useGoToProfile(user)

  const handleShare = useCallback(
    (senderHandle: string) => {
      const shareText = messages.twitterShare(senderHandle, uiAmount)
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_TIP_RECEIVED_TWITTER_SHARE,
        { text: shareText }
      )

      return { shareText, analytics }
    },
    [uiAmount]
  )

  const handleMouseEnter = useCallback(() => setIsTileDisabled(true), [])
  const handleMouseLeave = useCallback(() => setIsTileDisabled(false), [])

  if (!user) return null

  return (
    <NotificationTile
      notification={notification}
      disabled={isTileDisabled}
      disableClosePanel
      onClick={handleClick}
    >
      <NotificationHeader icon={<IconTip />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <div className={styles.bodyText}>
          <ProfilePicture className={styles.profilePicture} user={user} />
          <span>
            <UserNameLink user={user} notification={notification} />{' '}
            {messages.sent} <AudioText value={uiAmount} />
          </span>
        </div>
        <div className={styles.sayThanks}>
          {reactionValue ? (
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
              onClick={(e) => {
                e.stopPropagation()
                setReaction(reactionType)
              }}
              isActive={
                reactionValue // treat 0 and null equivalently here
                  ? reactionType === reactionValue
                  : undefined
              }
              isResponsive
            />
          ))}
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
