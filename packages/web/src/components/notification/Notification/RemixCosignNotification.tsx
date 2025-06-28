import { useCallback } from 'react'

import { useNotificationEntities } from '@audius/common/api'
import { Name } from '@audius/common/models'
import {
  TrackEntity,
  RemixCosignNotification as RemixCosignNotificationType
} from '@audius/common/store'
import { useDispatch } from 'react-redux'
import { Flex } from '~harmony/components/layout/Flex'

import { make } from 'common/store/analytics/actions'
import { XShareButton } from 'components/x-share-button/XShareButton'
import { push } from 'utils/navigation'

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { TrackContent } from './components/TrackContent'
import { UserNameLink } from './components/UserNameLink'
import { IconRemix } from './components/icons'
import { getEntityLink } from './utils'

const messages = {
  title: 'Remix was Co-signed',
  cosign: 'Co-signed your Remix of',
  shareXText: (trackTitle: string, handle: string) =>
    `My remix of ${trackTitle} was Co-Signed by ${handle} on @audius #Audius $AUDIO`
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

  const entities = useNotificationEntities(notification)
  const tracks = entities as TrackEntity[]
  const user = tracks?.[0]?.user

  const dispatch = useDispatch()

  const childTrack = tracks?.find((track) => track.track_id === childTrackId)
  const parentTrack = tracks?.find(
    (track) => track.owner_id === parentTrackUserId
  )

  const handleClick = useCallback(() => {
    if (!childTrack) return
    dispatch(push(getEntityLink(childTrack)))
  }, [childTrack, dispatch])

  const handleXShare = useCallback(
    (parentTrackUserHandle: string) => {
      const parentTrackTitle = parentTrack?.title || ''
      const shareText = messages.shareXText(
        parentTrackTitle,
        parentTrackUserHandle
      )
      return {
        shareText,
        analytics: make(Name.NOTIFICATIONS_CLICK_REMIX_COSIGN_TWITTER_SHARE, {
          text: shareText
        })
      }
    },
    [parentTrack?.title]
  )

  if (!user || !parentTrack || !childTrack) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconRemix />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <Flex>
        <TrackContent track={childTrack} hideTitle />
        <NotificationBody>
          <UserNameLink user={user} notification={notification} />{' '}
          {messages.cosign}{' '}
          <EntityLink entity={parentTrack} entityType={entityType} />
        </NotificationBody>
      </Flex>
      <XShareButton
        type='dynamic'
        handle={user.handle}
        shareData={handleXShare}
        url={getEntityLink(childTrack, true)}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
