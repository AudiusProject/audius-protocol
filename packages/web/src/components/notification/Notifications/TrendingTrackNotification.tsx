import React, { useCallback } from 'react'

import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { Name } from 'common/models/Analytics'
import { TrendingTrack } from 'common/store/notifications/types'
import { make, useRecord } from 'store/analytics/actions'
import { openTwitterLink } from 'utils/tweet'

import { EntityLink } from './EntityLink'
import { NotificationBody } from './NotificationBody'
import { NotificationFooter } from './NotificationFooter'
import { NotificationHeader } from './NotificationHeader'
import { NotificationTile } from './NotificationTile'
import { NotificationTitle } from './NotificationTitle'
import { TwitterShareButton } from './TwitterShareButton'
import { IconTrending } from './icons'
import { getRankSuffix, getEntityLink } from './utils'

const messages = {
  title: 'Trending on Audius!',
  your: 'Your track',
  is: 'is',
  trending: 'on Trending right now!',
  twitterShareText: (entityTitle: string, rank: number) =>
    `My track ${entityTitle} is trending ${rank}${getRankSuffix(
      rank
    )} on @AudiusProject! #AudiusTrending #Audius`
}

type TrendingTrackNotificationProps = {
  notification: TrendingTrack
}

export const TrendingTrackNotification = (
  props: TrendingTrackNotificationProps
) => {
  const { notification } = props
  const { entity, entityType, rank, timeLabel, isRead } = notification
  const rankSuffix = getRankSuffix(rank)
  const dispatch = useDispatch()
  const record = useRecord()

  const handleShare = useCallback(() => {
    const { entity, rank } = notification
    const link = getEntityLink(entity, true)
    const text = messages.twitterShareText(entity.title, rank)
    openTwitterLink(link, text)
    record(
      make(Name.NOTIFICATIONS_CLICK_MILESTONE_TWITTER_SHARE, {
        milestone: text
      })
    )
  }, [notification, record])

  const handleClick = useCallback(() => {
    dispatch(push(getEntityLink(entity)))
  }, [dispatch, entity])

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTrending />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        {messages.your} <EntityLink entity={entity} entityType={entityType} />{' '}
        {messages.is} {rank}
        {rankSuffix} {messages.trending}
      </NotificationBody>
      <TwitterShareButton onClick={handleShare} />
      <NotificationFooter timeLabel={timeLabel} isRead={isRead} />
    </NotificationTile>
  )
}
