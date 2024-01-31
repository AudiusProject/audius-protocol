import {
  notificationsSelectors,
  CollectionEntity,
  TrendingPlaylistNotification as TrendingPlaylistNotificationType
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
import { TwitterShareButton } from './components/TwitterShareButton'
import { IconTrending } from './components/icons'
import { getEntityLink } from './utils'
const { getNotificationEntity } = notificationsSelectors

const messages = {
  title: "You're Trending",
  is: 'is the',
  trending: 'trending playlist on Audius right now!',
  twitterShareText: (entityTitle: string) =>
    `My playlist ${entityTitle} is trending on @audius! Check it out! #Audius #AudiusTrending `
}

type TrendingPlaylistNotificationProps = {
  notification: TrendingPlaylistNotificationType
}

export const TrendingPlaylistNotification = (
  props: TrendingPlaylistNotificationProps
) => {
  const { notification } = props
  const { entityType, rank, timeLabel, isViewed } = notification
  const dispatch = useDispatch()
  const playlist = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<CollectionEntity>

  const handleClick = useCallback(() => {
    if (playlist) {
      dispatch(push(getEntityLink(playlist)))
    }
  }, [dispatch, playlist])

  if (!playlist) return null

  const shareText = messages.twitterShareText(playlist.playlist_name)

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTrending />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <EntityLink entity={playlist} entityType={entityType} /> {messages.is} #
        {rank} {messages.trending}
      </NotificationBody>
      <TwitterShareButton
        type='static'
        url={getEntityLink(playlist, true)}
        shareText={shareText}
        analytics={make(
          Name.NOTIFICATIONS_CLICK_TRENDING_PLAYLIST_TWITTER_SHARE,
          {
            text: shareText
          }
        )}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
