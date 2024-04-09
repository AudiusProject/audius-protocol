import { useCallback } from 'react'

import {
  notificationsSelectors,
  Entity,
  TrackAddedToPurchasedAlbumNotification
} from '@audius/common/store'
import { IconStars } from '@audius/harmony'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { useSelector } from 'utils/reducer'

import styles from './TipSentNotification.module.css'
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
  notification: TrackAddedToPurchasedAlbumNotification
}

export const AddTrackToPlaylistNotification = (
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
    dispatch(push(getEntityLink(playlist)))
  }, [playlist, dispatch])

  if (!playlistOwner || !track) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconStars />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <ProfilePicture
          className={styles.profilePicture}
          user={playlistOwner}
        />
        <span>
          <UserNameLink user={playlistOwner} notification={notification} />
          {messages.released}
          <EntityLink entity={track} entityType={Entity.Track} />
          {messages.onAlbum}
          <EntityLink entity={playlist} entityType={Entity.Playlist} />
        </span>
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
