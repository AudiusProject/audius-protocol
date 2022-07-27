import type { UserCollection } from '@audius/common'
import type { ShareModalContent } from 'audius-client/src/common/store/ui/share-modal/types'

import {
  getCollectionRoute,
  getTrackRoute,
  getUserRoute
} from 'app/utils/routes'
import { getTwitterLink } from 'app/utils/twitter'

import { messages } from './messages'

export const getContentUrl = (content: ShareModalContent) => {
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
      return getCollectionRoute(
        { ...album, user: artist } as unknown as UserCollection,
        true
      )
    }
    case 'playlist': {
      const { playlist, creator } = content
      return getCollectionRoute(
        { ...playlist, user: creator } as unknown as UserCollection,
        true
      )
    }
    // TODO: add audioNFTPlaylist link
    case 'audioNftPlaylist': {
      return ''
    }
  }
}

export const getTwitterShareText = (content: ShareModalContent) => {
  switch (content.type) {
    case 'track': {
      const {
        track: { title },
        artist: { handle }
      } = content
      return messages.trackShareText(title, handle)
    }
    case 'profile': {
      const {
        profile: { handle }
      } = content
      return messages.profileShareText(handle)
    }
    case 'album': {
      const {
        album: { playlist_name },
        artist: { handle }
      } = content
      return messages.albumShareText(playlist_name, handle)
    }
    case 'playlist': {
      const {
        playlist: { playlist_name },
        creator: { handle }
      } = content
      return messages.playlistShareText(playlist_name, handle)
    }
    case 'audioNftPlaylist': {
      return messages.nftPlaylistShareText
    }
  }
}

export const getTwitterShareUrl = (content: ShareModalContent) => {
  const url = getContentUrl(content)
  const shareText = getTwitterShareText(content)
  return getTwitterLink(url ?? null, shareText)
}
