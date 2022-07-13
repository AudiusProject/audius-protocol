import { useCallback } from 'react'

import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { Name } from 'common/models/Analytics'
import { RemixCosign, TrackEntity } from 'common/store/notifications/types'
import { make } from 'store/analytics/actions'

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

const messages = {
  title: 'Remix Co-sign',
  cosign: 'Co-signed your Remix of',
  shareTwitterText: (track: TrackEntity, handle: string) =>
    `My remix of ${track.title} was Co-Signed by ${handle} on @AudiusProject #Audius`
}

type RemixCosignNotificationProps = {
  notification: RemixCosign
}

export const RemixCosignNotification = (
  props: RemixCosignNotificationProps
) => {
  const { notification } = props
  const {
    user,
    entities,
    entityType,
    timeLabel,
    isViewed,
    childTrackId,
    parentTrackUserId
  } = notification
  const dispatch = useDispatch()

  const childTrack = entities.find(
    (track) => track.track_id === childTrackId
  ) as TrackEntity

  const parentTrack = entities.find(
    (track) => track.owner_id === parentTrackUserId
  ) as TrackEntity

  const handleClick = useCallback(() => {
    dispatch(push(getEntityLink(childTrack)))
  }, [childTrack, dispatch])

  const handleTwitterShare = useCallback(
    (handle: string) => {
      const shareText = messages.shareTwitterText(parentTrack, handle)
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_REMIX_COSIGN_TWITTER_SHARE,
        {
          text: shareText
        }
      )
      return { shareText, analytics }
    },
    [parentTrack]
  )

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
