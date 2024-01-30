import { useCallback } from 'react'

import {
  notificationsSelectors,
  RemixCreateNotification as RemixCreateNotificationType,
  TrackEntity
} from '@audius/common'
import { Name } from '@audius/common/models'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { useSelector } from 'utils/reducer'

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { TwitterShareButton } from './components/TwitterShareButton'
import { UserNameLink } from './components/UserNameLink'
import { IconRemix } from './components/icons'
import { getEntityLink } from './utils'
const { getNotificationUser, getNotificationTrack } = notificationsSelectors

const messages = {
  title: 'New remix of your track',
  by: 'by',
  shareTwitterText: (track: TrackEntity, handle: string) =>
    `New remix of ${track.title} by ${handle} on @audius #Audius`
}

type RemixCreateNotificationProps = {
  notification: RemixCreateNotificationType
}

export const RemixCreateNotification = (
  props: RemixCreateNotificationProps
) => {
  const { notification } = props
  const { entityType, timeLabel, isViewed, childTrackId, parentTrackId } =
    notification
  const dispatch = useDispatch()
  const user = useSelector((state) => getNotificationUser(state, notification))

  const childTrack = useSelector((state) =>
    getNotificationTrack(state, childTrackId)
  )
  const parentTrack = useSelector((state) =>
    getNotificationTrack(state, parentTrackId)
  )

  const handleClick = useCallback(() => {
    if (childTrack) {
      dispatch(push(getEntityLink(childTrack)))
    }
  }, [childTrack, dispatch])

  const handleShare = useCallback(
    (twitterHandle: string) => {
      if (!parentTrack) return null
      const shareText = messages.shareTwitterText(parentTrack, twitterHandle)
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_REMIX_CREATE_TWITTER_SHARE,
        { text: shareText }
      )
      return { shareText, analytics }
    },
    [parentTrack]
  )

  if (!user || !parentTrack || !childTrack) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconRemix />}>
        <NotificationTitle>
          {messages.title}{' '}
          <EntityLink entity={parentTrack} entityType={entityType} />
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <EntityLink entity={childTrack} entityType={entityType} /> {messages.by}{' '}
        <UserNameLink user={user} notification={notification} />
      </NotificationBody>
      <TwitterShareButton
        type='dynamic'
        handle={user.handle}
        url={getEntityLink(parentTrack, true)}
        shareData={handleShare}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
