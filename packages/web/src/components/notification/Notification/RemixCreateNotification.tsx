import { useCallback } from 'react'

import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { Name } from 'common/models/Analytics'
import { RemixCreate, TrackEntity } from 'common/store/notifications/types'
import { make } from 'store/analytics/actions'

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

const messages = {
  title: 'New remix of your track',
  by: 'by',
  shareTwitterText: (track: TrackEntity, handle: string) =>
    `New remix of ${track.title} by ${handle} on @AudiusProject #Audius`
}

type RemixCreateNotificationProps = {
  notification: RemixCreate
}

export const RemixCreateNotification = (
  props: RemixCreateNotificationProps
) => {
  const { notification } = props
  const {
    user,
    entities,
    entityType,
    timeLabel,
    isViewed,
    childTrackId,
    parentTrackId
  } = notification
  const dispatch = useDispatch()

  const childTrack = entities.find(
    (track) => track.track_id === childTrackId
  ) as TrackEntity

  const parentTrack = entities.find(
    (track) => track.track_id === parentTrackId
  ) as TrackEntity

  const handleClick = useCallback(() => {
    dispatch(push(getEntityLink(childTrack)))
  }, [childTrack, dispatch])

  const handleShare = useCallback(
    (twitterHandle: string) => {
      const shareText = messages.shareTwitterText(parentTrack, twitterHandle)
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_REMIX_CREATE_TWITTER_SHARE,
        { text: shareText }
      )
      return { shareText, analytics }
    },
    [parentTrack]
  )

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
