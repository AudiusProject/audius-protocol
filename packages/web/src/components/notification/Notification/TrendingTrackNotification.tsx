import {
  notificationsSelectors,
  TrackEntity,
  TrendingTrackNotification as TrendingTrackNotificationType
} from '@audius/common/store'

import { useCallback } from 'react'

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
import { TwitterShareButton } from './components/TwitterShareButton'
import { IconTrending } from './components/icons'
import { getEntityLink } from './utils'
const { getNotificationEntity } = notificationsSelectors

const messages = {
  title: "You're Trending",
  is: 'is',
  trending: 'on Trending right now!',
  twitterShareText: (entityTitle: string) =>
    `My track ${entityTitle} is trending on @audius! Check it out! #Audius #AudiusTrending`
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
  const track = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<TrackEntity>

  const handleClick = useCallback(() => {
    if (track) {
      dispatch(push(getEntityLink(track)))
    }
  }, [dispatch, track])

  if (!track) return null

  const shareText = messages.twitterShareText(track.title)

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTrending />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <EntityLink entity={track} entityType={entityType} /> {messages.is} #
        {rank} {messages.trending}
      </NotificationBody>
      <TwitterShareButton
        type='static'
        url={getEntityLink(track, true)}
        shareText={shareText}
        analytics={make(Name.NOTIFICATIONS_CLICK_TRENDING_TRACK_TWITTER_SHARE, {
          text: shareText
        })}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
