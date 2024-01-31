import type { ShareContent } from '@audius/common/store'
import { makeTwitterShareUrl } from '@audius/common/utils'

import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import {
  getCollectionRoute,
  getTrackRoute,
  getUserRoute
} from 'app/utils/routes'

import { messages } from './messages'

export const getContentUrl = (content: ShareContent) => {
  switch (content.type) {
    case 'track': {
      const { track } = content
      return getTrackRoute(track, true)
    }
    case 'profile': {
      const { profile } = content
      return getUserRoute(profile, true)
    }
    case 'album': {
      const { album, artist } = content
      return getCollectionRoute({ ...album, user: artist }, true)
    }
    case 'playlist': {
      const { playlist, creator } = content
      return getCollectionRoute({ ...playlist, user: creator }, true)
    }
    // TODO: add audioNFTPlaylist link
    case 'audioNftPlaylist': {
      return ''
    }
  }
}

const getShareHandle = async (handle: string) => {
  const { twitterHandle } = await audiusBackendInstance.getSocialHandles(handle)
  return twitterHandle ? `@${twitterHandle}` : handle
}

export const getTwitterShareText = async (content: ShareContent) => {
  switch (content.type) {
    case 'track': {
      const {
        track: { title },
        artist: { handle }
      } = content
      return messages.trackShareText(title, await getShareHandle(handle))
    }
    case 'profile': {
      const {
        profile: { handle }
      } = content
      return messages.profileShareText(await getShareHandle(handle))
    }
    case 'album': {
      const {
        album: { playlist_name },
        artist: { handle }
      } = content
      return messages.albumShareText(
        playlist_name,
        await getShareHandle(handle)
      )
    }
    case 'playlist': {
      const {
        playlist: { playlist_name },
        creator: { handle }
      } = content
      return messages.playlistShareText(
        playlist_name,
        await getShareHandle(handle)
      )
    }
    case 'audioNftPlaylist': {
      return messages.nftPlaylistShareText
    }
  }
}

export const getTwitterShareUrl = async (content: ShareContent) => {
  const url = getContentUrl(content)
  const shareText = await getTwitterShareText(content)
  return makeTwitterShareUrl(url ?? null, shareText)
}
