import { useCallback } from 'react'

import { useNotificationEntity } from '@audius/common/api'
import { Name } from '@audius/common/models'
import {
  TrackEntity,
  TrendingTrackNotification as TrendingTrackNotificationType
} from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { XShareButton } from 'components/x-share-button/XShareButton'
import { push } from 'utils/navigation'

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { IconTrending } from './components/icons'
import { getEntityLink } from './utils'

const messages = {
  title: "You're Trending",
  is: 'is',
  trending: 'on Trending right now!',
  xShareText: (entityTitle: string) =>
    `My track ${entityTitle} is trending on @audius! Check it out! $AUDIO`
}

type TrendingTrackNotificationProps = {
  notification: TrendingTrackNotificationType
}

export const TrendingTrackNotification = (
  props: TrendingTrackNotificationProps
) => {
  const { notification } = props
  const { entityType, rank, timeLabel, isViewed } = notification
  const dispatch = useDispatch()

  const entity = useNotificationEntity(notification)

  const handleClick = useCallback(() => {
    if (entity) {
      dispatch(push(getEntityLink(entity)))
    }
  }, [dispatch, entity])

  if (!entity) return null

  const shareText = messages.xShareText((entity as TrackEntity).title)

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTrending />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <EntityLink entity={entity} entityType={entityType} /> {messages.is} #
        {rank} {messages.trending}
      </NotificationBody>
      <XShareButton
        type='static'
        url={getEntityLink(entity, true)}
        shareText={shareText}
        analytics={make(Name.NOTIFICATIONS_CLICK_TRENDING_TRACK_TWITTER_SHARE, {
          text: shareText
        })}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
