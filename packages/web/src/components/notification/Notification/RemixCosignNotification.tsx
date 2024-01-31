import {
  notificationsSelectors,
  TrackEntity,
  RemixCosignNotification as RemixCosignNotificationType
} from '@audius/common/store'

import { useCallback } from 'react'

import {} from '@audius/common'
import { Name } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
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
import { TrackContent } from './components/TrackContent'
import { TwitterShareButton } from './components/TwitterShareButton'
import { UserNameLink } from './components/UserNameLink'
import { IconRemix } from './components/icons'
import { getEntityLink } from './utils'
const { getNotificationEntities, getNotificationUser } = notificationsSelectors

const messages = {
  title: 'Remix Co-sign',
  cosign: 'Co-signed your Remix of',
  shareTwitterText: (trackTitle: string, handle: string) =>
    `My remix of ${trackTitle} was Co-Signed by ${handle} on @audius #Audius`
}

type RemixCosignNotificationProps = {
  notification: RemixCosignNotificationType
}

export const RemixCosignNotification = (
  props: RemixCosignNotificationProps
) => {
  const { notification } = props
  const { entityType, timeLabel, isViewed, childTrackId, parentTrackUserId } =
    notification

  const user = useSelector((state) => getNotificationUser(state, notification))

  // TODO: casting from EntityType to TrackEntity here, but
  // getNotificationEntities should be smart enough based on notif type
  const tracks = useSelector((state) =>
    getNotificationEntities(state, notification)
  ) as Nullable<TrackEntity[]>

  const dispatch = useDispatch()

  const childTrack = tracks?.find((track) => track.track_id === childTrackId)

  const parentTrack = tracks?.find(
    (track) => track.owner_id === parentTrackUserId
  )
  const parentTrackTitle = parentTrack?.title

  const handleClick = useCallback(() => {
    if (!childTrack) return
    dispatch(push(getEntityLink(childTrack)))
  }, [childTrack, dispatch])

  const handleTwitterShare = useCallback(
    (handle: string) => {
      if (!parentTrackTitle) return null
      const shareText = messages.shareTwitterText(parentTrackTitle, handle)
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_REMIX_COSIGN_TWITTER_SHARE,
        {
          text: shareText
        }
      )
      return { shareText, analytics }
    },
    [parentTrackTitle]
  )

  if (!user || !parentTrack || !childTrack) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconRemix />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <UserNameLink user={user} notification={notification} />{' '}
        {messages.cosign}{' '}
        <EntityLink entity={parentTrack} entityType={entityType} />
      </NotificationBody>
      <div>
        <TrackContent track={childTrack} />
      </div>
      <TwitterShareButton
        type='dynamic'
        handle={user.handle}
        shareData={handleTwitterShare}
        url={getEntityLink(childTrack, true)}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
