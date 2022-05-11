import React, { useCallback } from 'react'

import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { Name } from 'common/models/Analytics'
import { RemixCosign, TrackEntity } from 'common/store/notifications/types'
import { make, useRecord } from 'store/analytics/actions'
import { openTwitterLink } from 'utils/tweet'

import TrackContent from '../components/TrackContent'

import { EntityLink } from './EntityLink'
import { NotificationBody } from './NotificationBody'
import { NotificationFooter } from './NotificationFooter'
import { NotificationHeader } from './NotificationHeader'
import { NotificationTile } from './NotificationTile'
import { NotificationTitle } from './NotificationTitle'
import { TwitterShareButton } from './TwitterShareButton'
import { UserNameLink } from './UserNameLink'
import { IconRemix } from './icons'
import { getTwitterHandleByUserHandle, getEntityLink } from './utils'

const messages = {
  title: 'Remix Co-sign',
  cosign: 'Co-signed your Remix of',
  shareTwitterText: (track: TrackEntity, handle: string) =>
    `My remix of ${track.title} was Co-Signed by ${handle} on @AudiusProject #Audius`
}

const getTwitterShareInfo = async (notification: RemixCosign) => {
  const { entities, parentTrackUserId, childTrackId } = notification
  const parentTrack = entities.find(t => t.owner_id === parentTrackUserId)
  const childtrack = entities.find(t => t.track_id === childTrackId)

  if (!parentTrack || !childtrack) return { text: '', link: '' }

  const link = getEntityLink(childtrack, true)

  let twitterHandle = await getTwitterHandleByUserHandle(
    notification.user.handle
  )
  if (!twitterHandle) twitterHandle = notification.user.name
  else twitterHandle = `@${twitterHandle}`
  const text = messages.shareTwitterText(parentTrack, twitterHandle)

  return { link, text }
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
    isRead,
    childTrackId
  } = notification
  const dispatch = useDispatch()
  const record = useRecord()

  const entity = entities.find(
    track => track.track_id === notification.childTrackId
  ) as TrackEntity

  const handleShare = useCallback(async () => {
    const { link, text } = await getTwitterShareInfo(notification)
    openTwitterLink(link, text)
    record(make(Name.NOTIFICATIONS_CLICK_REMIX_COSIGN_TWITTER_SHARE, { text }))
  }, [notification, record])

  const handleClick = useCallback(() => {
    const childTrack = entities.find(track => track.track_id === childTrackId)
    if (childTrack) {
      dispatch(push(getEntityLink(childTrack)))
    }
  }, [entities, childTrackId, dispatch])

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconRemix />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <UserNameLink user={user} notification={notification} />{' '}
        {messages.cosign} <EntityLink entity={entity} entityType={entityType} />
      </NotificationBody>
      <div>
        <TrackContent notification={notification} goToEntityPage={() => {}} />
      </div>
      <TwitterShareButton onClick={handleShare} />
      <NotificationFooter timeLabel={timeLabel} isRead={isRead} />
    </NotificationTile>
  )
}
