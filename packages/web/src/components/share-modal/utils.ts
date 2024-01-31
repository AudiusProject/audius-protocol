import { ShareContent } from '@audius/common/store'
import {} from '@audius/common'
import { ShareToTwitter } from '@audius/common/models'

import { getTwitterHandleByUserHandle } from 'components/notification/Notification/utils'
import {
  fullCollectionPage,
  fullProfilePage,
  fullTrackPage,
  fullAudioNftPlaylistPage
} from 'utils/route'

import { messages } from './messages'

type ShareToTwitterEvent = Omit<ShareToTwitter, 'eventName' | 'source'>

const getShareHandle = async (handle: string) => {
  const twitterHandle = await getTwitterHandleByUserHandle(handle)
  return twitterHandle ? `@${twitterHandle}` : handle
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
        artist: { handle }
      } = content
      twitterText = messageConfig.trackShareText(
        title,
        await getShareHandle(handle)
      )
      link = fullTrackPage(permalink)
      analyticsEvent = { kind: 'track', id: track_id, url: link }
      break
    }
    case 'profile': {
      const {
        profile: { handle, user_id }
      } = content
      twitterText = messageConfig.profileShareText(await getShareHandle(handle))
      link = fullProfilePage(handle)
      analyticsEvent = { kind: 'profile', id: user_id, url: link }
      break
    }
    case 'album': {
      const {
        album: { playlist_name, playlist_id, permalink },
        artist: { handle }
      } = content
      twitterText = messageConfig.albumShareText(
        playlist_name,
        await getShareHandle(handle)
      )
      link = fullCollectionPage(
        handle,
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
        creator: { handle }
      } = content
      twitterText = messageConfig.playlistShareText(
        playlist_name,
        await getShareHandle(handle)
      )
      link = fullCollectionPage(
        handle,
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
