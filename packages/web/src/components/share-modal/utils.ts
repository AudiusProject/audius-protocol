import { ShareToTwitter, User } from '@audius/common/models'
import { ShareContent } from '@audius/common/store'

import { getTwitterHandleByUserHandle } from 'components/notification/Notification/utils'
import {
  fullCollectionPage,
  fullProfilePage,
  fullTrackPage,
  fullAudioNftPlaylistPage
} from 'utils/route'

import { messages } from './messages'

type ShareToTwitterEvent = Omit<ShareToTwitter, 'eventName' | 'source'>

const getTwitterShareHandle = async (user: User) => {
  const twitterHandle = await getTwitterHandleByUserHandle(user)
  return twitterHandle ? `@${twitterHandle}` : user.handle
}

export type ShareMessageConfig = Pick<
  typeof messages,
  | 'profileShareText'
  | 'trackShareText'
  | 'playlistShareText'
  | 'albumShareText'
  | 'audioNftPlaylistShareText'
>

export const getTwitterShareText = async (
  content: ShareContent,
  isPlaylistOwner = false,
  messageConfig: ShareMessageConfig = messages
) => {
  let twitterText = ''
  let link = ''
  let analyticsEvent: ShareToTwitterEvent
  switch (content.type) {
    case 'track': {
      const {
        track: { title, permalink, track_id },
        artist
      } = content
      twitterText = messageConfig.trackShareText(
        title,
        await getTwitterShareHandle(artist)
      )
      link = fullTrackPage(permalink)
      analyticsEvent = { kind: 'track', id: track_id, url: link }
      break
    }
    case 'profile': {
      const { profile } = content
      twitterText = messageConfig.profileShareText(
        await getTwitterShareHandle(profile)
      )
      link = fullProfilePage(profile.handle)
      analyticsEvent = { kind: 'profile', id: profile.user_id, url: link }
      break
    }
    case 'album': {
      const {
        album: { playlist_name, playlist_id, permalink },
        artist
      } = content
      twitterText = messageConfig.albumShareText(
        playlist_name,
        await getTwitterShareHandle(artist)
      )
      link = fullCollectionPage(
        artist.handle,
        playlist_name,
        playlist_id,
        permalink,
        true
      )
      analyticsEvent = { kind: 'album', id: playlist_id, url: link }
      break
    }
    case 'playlist': {
      const {
        playlist: { playlist_name, playlist_id, permalink, is_album },
        creator
      } = content
      twitterText = messageConfig.playlistShareText(
        playlist_name,
        await getTwitterShareHandle(creator)
      )
      link = fullCollectionPage(
        creator.handle,
        playlist_name,
        playlist_id,
        permalink,
        is_album
      )
      analyticsEvent = { kind: 'playlist', id: playlist_id, url: link }
      break
    }
    case 'audioNftPlaylist': {
      const {
        user: { handle, name, user_id }
      } = content
      twitterText = messageConfig.audioNftPlaylistShareText(
        isPlaylistOwner ? 'my' : name
      )
      link = fullAudioNftPlaylistPage(handle)
      analyticsEvent = { kind: 'audioNftPlaylist', id: user_id, url: link }
      break
    }
  }

  return { twitterText, link, analyticsEvent }
}
