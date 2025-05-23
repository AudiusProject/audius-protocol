import { useCallback } from 'react'

import { useNotificationEntities } from '@audius/common/api'
import {
  Entity,
  TrackAddedToPurchasedAlbumNotification as TrackAddedToPurchasedAlbumNotificationType
} from '@audius/common/store'
import { Flex, IconStars } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { push } from 'utils/navigation'

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { ProfilePicture } from './components/ProfilePicture'
import { UserNameLink } from './components/UserNameLink'
import { getEntityLink } from './utils'

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
  const entities = useNotificationEntities(notification)
  const { track, playlist } = entities
  const playlistOwner = playlist?.user
  const { timeLabel, isViewed } = notification

  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    if (playlist) {
      const link = getEntityLink(playlist)
      dispatch(push(link))
    }
  }, [dispatch, playlist])

  if (!playlistOwner || !track || !playlist) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconStars />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <Flex gap='s' alignItems='center'>
          <ProfilePicture user={playlistOwner} />
          <span>
            <UserNameLink user={playlistOwner} notification={notification} />
            {messages.released}
            <EntityLink entity={track} entityType={Entity.Track} />
            {messages.onAlbum}
            <EntityLink entity={playlist} entityType={Entity.Playlist} />
          </span>
        </Flex>
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
