import { useCallback } from 'react'

import { useNotificationEntities } from '@audius/common/api'
import { Name, Track } from '@audius/common/models'
import {
  Entity,
  CollectionEntity,
  AddTrackToPlaylistNotification as AddTrackToPlaylistNotificationType
} from '@audius/common/store'
import { Flex } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { push } from 'utils/navigation'

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
    track: Track,
    playlist: CollectionEntity
  ) =>
    `My track ${track.title} was added to the playlist ${playlist.playlist_name} by ${handle} on @audius! #Audius $AUDIO`
}

type AddTrackToPlaylistNotificationProps = {
  notification: AddTrackToPlaylistNotificationType
}

export const AddTrackToPlaylistNotification = (
  props: AddTrackToPlaylistNotificationProps
) => {
  const { notification } = props
  const { timeLabel, isViewed } = notification
  const entities = useNotificationEntities(notification)
  const { track, playlist } = entities
  const playlistOwner = playlist?.user

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
    if (playlist) {
      dispatch(push(getEntityLink(playlist)))
    }
  }, [playlist, dispatch])

  if (!playlistOwner || !track || !playlist) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconAddTrackToPlaylist />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <Flex as={NotificationBody} alignItems='center' gap='s'>
        <ProfilePicture user={playlistOwner} />
        <span>
          <UserNameLink user={playlistOwner} notification={notification} />
          {' added your track '}
          <EntityLink entity={track} entityType={Entity.Track} />
          {' to their playlist '}
          <EntityLink entity={playlist} entityType={Entity.Playlist} />
        </span>
      </Flex>
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
