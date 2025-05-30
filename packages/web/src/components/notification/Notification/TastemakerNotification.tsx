import { useCallback } from 'react'

import { Name } from '@audius/common/models'
import {
  notificationsSelectors,
  TrackEntity,
  TastemakerNotification as TastemakerNotificationType
} from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { push } from 'utils/navigation'
import { useSelector } from 'utils/reducer'

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { TwitterShareButton } from './components/TwitterShareButton'
import { IconTastemaker } from './components/icons'
import { getEntityLink } from './utils'
const { getNotificationEntity, getNotificationUser } = notificationsSelectors

const messages = {
  title: 'You’re a Tastemaker!',
  is: 'is',
  tastemaker: 'now trending thanks to you! Great work 🙌',
  twitterShare: (trackOwnerHandle: string, trackTitle: string) => {
    return `I was one of the first to discover ${trackTitle} by ${trackOwnerHandle} on @audius and it just made it onto trending! #Audius #AudiusTastemaker $AUDIO`
  }
}

type TastemakerNotificationProps = {
  notification: TastemakerNotificationType
}

export const TastemakerNotification = (props: TastemakerNotificationProps) => {
  const { notification } = props
  const { entityType, timeLabel, isViewed } = notification
  const dispatch = useDispatch()
  const track = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<TrackEntity>
  const trackOwnerUser = useSelector((state) =>
    getNotificationUser(state, notification)
  )

  const handleClick = useCallback(() => {
    if (track) {
      dispatch(push(getEntityLink(track)))
    }
  }, [dispatch, track])

  const handleShare = useCallback(
    (trackOwnerHandle: string) => {
      const trackTitle = track?.title || ''
      const shareText = messages.twitterShare(trackOwnerHandle, trackTitle)
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_TASTEMAKER_TWITTER_SHARE,
        { text: shareText }
      )
      return { shareText: track ? shareText : '', analytics }
    },
    [track]
  )

  if (!track || !trackOwnerUser) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTastemaker />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <EntityLink entity={track} entityType={entityType} /> {messages.is}{' '}
        {messages.tastemaker}
      </NotificationBody>
      <TwitterShareButton
        type='dynamic'
        handle={trackOwnerUser.handle}
        shareData={handleShare}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
