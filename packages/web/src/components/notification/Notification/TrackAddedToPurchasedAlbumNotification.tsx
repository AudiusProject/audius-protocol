import { useCallback } from 'react'

import {
  notificationsSelectors,
  Entity,
  TrackAddedToPurchasedAlbumNotification as TrackAddedToPurchasedAlbumNotificationType
} from '@audius/common/store'
import { Flex, IconStars } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { push } from 'utils/navigation'
import { useSelector } from 'utils/reducer'

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { ProfilePicture } from './components/ProfilePicture'
import { UserNameLink } from './components/UserNameLink'
import { getEntityLink } from './utils'
const { getNotificationEntities } = notificationsSelectors

const messages = {
  title: 'New Release',
  released: ' released a new track ',
  onAlbum: ' on the album you purchased, '
}

type TrackAddedToPurchasedAlbumNotificationProps = {
  notification: TrackAddedToPurchasedAlbumNotificationType
}

export const TrackAddedToPurchasedAlbumNotification = (
  props: TrackAddedToPurchasedAlbumNotificationProps
) => {
  const { notification } = props
  const { timeLabel, isViewed } = notification
  const { track, playlist } = useSelector((state) =>
    getNotificationEntities(state, notification)
  )
  const playlistOwner = playlist.user

  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    dispatch(push(getEntityLink(playlist), { forceFetch: true }))
  }, [playlist, dispatch])

  if (!playlistOwner || !track) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconStars color='accent' />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <Flex as={NotificationBody} alignItems='center' gap='s'>
        <ProfilePicture user={playlistOwner} />
        <span>
          <UserNameLink user={playlistOwner} notification={notification} />
          {messages.released}
          <EntityLink entity={track} entityType={Entity.Track} />
          {messages.onAlbum}
          <EntityLink entity={playlist} entityType={Entity.Playlist} />
        </span>
      </Flex>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
