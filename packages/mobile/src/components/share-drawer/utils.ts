import type { ShareContent } from '@audius/common/store'
import { makeTwitterShareUrl } from '@audius/common/utils'
import type { User } from '~/models'

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
      const { album } = content
      return getCollectionRoute(album, true)
    }
    case 'playlist': {
      const { playlist } = content
      return getCollectionRoute(playlist, true)
    }
    // TODO: add audioNFTPlaylist link
    case 'audioNftPlaylist': {
      return ''
    }
  }
}

const getTwitterShareHandle = (user: User) => {
  const twitterHandle = user.twitter_handle
  return twitterHandle ? `@${twitterHandle}` : user.handle
}

export const getTwitterShareText = async (content: ShareContent) => {
  switch (content.type) {
    case 'track': {
      const {
        track: { title },
        artist
      } = content
      return messages.trackShareText(title, getTwitterShareHandle(artist))
    }
    case 'profile': {
      const { profile } = content
      return messages.profileShareText(getTwitterShareHandle(profile))
    }
    case 'album': {
      const {
        album: { playlist_name },
        artist
      } = content
      return messages.albumShareText(
        playlist_name,
        getTwitterShareHandle(artist)
      )
    }
    case 'playlist': {
      const {
        playlist: { playlist_name },
        creator
      } = content
      return messages.playlistShareText(
        playlist_name,
        getTwitterShareHandle(creator)
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
