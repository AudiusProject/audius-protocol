import React, { useCallback } from 'react'

import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { Name } from 'common/models/Analytics'
import { RemixCreate, TrackEntity } from 'common/store/notifications/types'
import { make, useRecord } from 'store/analytics/actions'
import { openTwitterLink } from 'utils/tweet'

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { TwitterShareButton } from './components/TwitterShareButton'
import { UserNameLink } from './components/UserNameLink'
import { IconRemix } from './components/icons'
import { getTwitterHandleByUserHandle, getEntityLink } from './utils'

const messages = {
  title: 'New remix of your track',
  by: 'by',
  shareTwitterText: (track: TrackEntity, handle: string) =>
    `New remix of ${track.title} by ${handle} on @AudiusProject #Audius`
}

const getTwitterShareInfo = async (notification: RemixCreate) => {
  const { entities, parentTrackId, user } = notification

  const track = entities.find(t => t.track_id === parentTrackId)
  if (!track) return null
  const link = getEntityLink(track, true)

  let twitterHandle = await getTwitterHandleByUserHandle(user.handle)
  if (!twitterHandle) twitterHandle = user.name
  else twitterHandle = `@${twitterHandle}`
  const text = messages.shareTwitterText(track, twitterHandle)

  return { link, text }
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
  const record = useRecord()

  const childTrack = entities.find(
    track => track.track_id === childTrackId
  ) as TrackEntity

  const parentTrack = entities.find(
    track => track.track_id === parentTrackId
  ) as TrackEntity

  const handleShare = useCallback(async () => {
    const shareInfo = await getTwitterShareInfo(notification)
    if (!shareInfo) return
    const { link, text } = shareInfo
    openTwitterLink(link, text)
    record(make(Name.NOTIFICATIONS_CLICK_REMIX_CREATE_TWITTER_SHARE, { text }))
  }, [notification, record])

  const handleClick = useCallback(() => {
    dispatch(push(getEntityLink(childTrack)))
  }, [childTrack, dispatch])

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
      <TwitterShareButton onClick={handleShare} />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
