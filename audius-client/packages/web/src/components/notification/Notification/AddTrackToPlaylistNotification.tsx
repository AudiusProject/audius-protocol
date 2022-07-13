import React, { useCallback } from 'react'

import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { Name } from 'common/models/Analytics'
import {
  AddTrackToPlaylist,
  CollectionEntity,
  Entity,
  TrackEntity
} from 'common/store/notifications/types'
import { make } from 'store/analytics/actions'

import styles from './TipSentNotification.module.css'
import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { ProfilePicture } from './components/ProfilePicture'
import { TwitterShareButton } from './components/TwitterShareButton'
import { UserNameLink } from './components/UserNameLink'
import { IconAddTrackToPlaylist } from './components/icons'
import { getEntityLink } from './utils'

const messages = {
  title: 'Track Added to Playlist',
  shareTwitterText: (
    handle: string,
    track: TrackEntity,
    playlist: CollectionEntity
  ) =>
    `My track ${track.title} was added to the playlist ${playlist.playlist_name} by ${handle} on @audiusproject! #Audius`
}

type AddTrackToPlaylistNotificationProps = {
  notification: AddTrackToPlaylist
}

export const AddTrackToPlaylistNotification = (
  props: AddTrackToPlaylistNotificationProps
) => {
  const { notification } = props
  const { entities, timeLabel, isViewed } = notification
  const { track, playlist } = entities
  const playlistOwner = playlist.user

  const dispatch = useDispatch()

  const handleTwitterShare = useCallback(
    (twitterHandle: string) => {
      if (track && playlist && twitterHandle) {
        const shareText = messages.shareTwitterText(
          twitterHandle,
          track,
          playlist
        )
        const analytics = make(
          Name.NOTIFICATIONS_CLICK_TIP_REACTION_TWITTER_SHARE,
          { text: shareText }
        )
        return { shareText, analytics }
      }
      return null
    },
    [track, playlist]
  )

  const handleClick = useCallback(() => {
    dispatch(push(getEntityLink(playlist)))
  }, [playlist, dispatch])

  if (!playlistOwner) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconAddTrackToPlaylist />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <ProfilePicture
          className={styles.profilePicture}
          user={playlistOwner}
        />
        <span>
          <UserNameLink user={playlistOwner} notification={notification} />
          {' added your track '}
          <EntityLink entity={track} entityType={Entity.Track} />
          {' to their playlist '}
          <EntityLink entity={playlist} entityType={Entity.Playlist} />
        </span>
      </NotificationBody>
      <TwitterShareButton
        type='dynamic'
        handle={playlistOwner.handle}
        shareData={handleTwitterShare}
        url={getEntityLink(playlist, true)}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
