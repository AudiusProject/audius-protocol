import { ShareToTwitter, ShareModalContent } from '@audius/common'

import {
  fullAlbumPage,
  fullPlaylistPage,
  fullProfilePage,
  fullTrackPage,
  fullAudioNftPlaylistPage
} from 'utils/route'

import { messages } from './messages'

type ShareToTwitterEvent = Omit<ShareToTwitter, 'eventName' | 'source'>

export const getTwitterShareText = (
  content: ShareModalContent,
  isPlaylistOwner = false
) => {
  let twitterText = ''
  let link = ''
  let analyticsEvent: ShareToTwitterEvent
  switch (content.type) {
    case 'track': {
      const {
        track: { title, permalink, track_id },
        artist: { handle }
      } = content
      twitterText = messages.trackShareText(title, handle)
      link = fullTrackPage(permalink)
      analyticsEvent = { kind: 'track', id: track_id, url: link }
      break
    }
    case 'profile': {
      const {
        profile: { handle, user_id }
      } = content
      twitterText = messages.profileShareText(handle)
      link = fullProfilePage(handle)
      analyticsEvent = { kind: 'profile', id: user_id, url: link }
      break
    }
    case 'album': {
      const {
        album: { playlist_name, playlist_id },
        artist: { handle }
      } = content
      twitterText = messages.albumShareText(playlist_name, handle)
      link = fullAlbumPage(handle, playlist_name, playlist_id)
      analyticsEvent = { kind: 'album', id: playlist_id, url: link }
      break
    }
    case 'playlist': {
      const {
        playlist: { playlist_name, playlist_id },
        creator: { handle }
      } = content
      twitterText = messages.playlistShareText(playlist_name, handle)
      link = fullPlaylistPage(handle, playlist_name, playlist_id)
      analyticsEvent = { kind: 'playlist', id: playlist_id, url: link }
      break
    }
    case 'audioNftPlaylist': {
      const {
        user: { handle, name, user_id }
      } = content
      twitterText = messages.audioNftPlaylistShareText(
        isPlaylistOwner ? 'my' : name
      )
      link = fullAudioNftPlaylistPage(handle)
      analyticsEvent = { kind: 'audioNftPlaylist', id: user_id, url: link }
      break
    }
  }

  return { twitterText, link, analyticsEvent }
}
