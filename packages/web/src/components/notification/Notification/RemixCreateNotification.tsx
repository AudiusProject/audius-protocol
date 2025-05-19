import { useCallback } from 'react'

import { useNotificationEntities } from '@audius/common/api'
import { Name, TrackMetadata } from '@audius/common/models'
import {
  notificationsSelectors,
  RemixCreateNotification as RemixCreateNotificationType,
  TrackEntity
} from '@audius/common/store'
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
import { UserNameLink } from './components/UserNameLink'
import { IconRemix } from './components/icons'
import { getEntityLink } from './utils'
const { getNotificationUser } = notificationsSelectors

const messages = {
  title: 'New remix of your track',
  by: 'by',
  shareTwitterText: (track: TrackMetadata, handle: string) =>
    `New remix of ${track.title} by ${handle} on @audius #Audius $AUDIO`
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

  const entities = useNotificationEntities(notification) as TrackEntity[] | null
  const childTrackEntity = entities?.find(
    (track) => track.track_id === childTrackId
  )
  const parentTrackEntity = entities?.find(
    (track) => track.track_id === parentTrackId
  )

  const handleClick = useCallback(() => {
    if (childTrackEntity) {
      dispatch(push(getEntityLink(childTrackEntity)))
    }
  }, [childTrackEntity, dispatch])

  const handleShare = useCallback(
    (twitterHandle: string) => {
      if (!parentTrackEntity) return null
      const shareText = messages.shareTwitterText(
        parentTrackEntity,
        twitterHandle
      )
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_REMIX_CREATE_TWITTER_SHARE,
        { text: shareText }
      )
      return { shareText, analytics }
    },
    [parentTrackEntity]
  )

  if (!user || !parentTrackEntity || !childTrackEntity) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconRemix />}>
        <NotificationTitle>
          {messages.title}{' '}
          <EntityLink entity={parentTrackEntity} entityType={entityType} />
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <EntityLink entity={childTrackEntity} entityType={entityType} />{' '}
        {messages.by} <UserNameLink user={user} notification={notification} />
      </NotificationBody>
      <TwitterShareButton
        type='dynamic'
        handle={user.handle}
        url={getEntityLink(parentTrackEntity, true)}
        shareData={handleShare}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
