import type { ShareContent } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
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

const getTwitterShareHandle = async ({
  handle,
  twitterHandle
}: {
  handle: string
  twitterHandle: Nullable<string>
}) => {
  if (!twitterHandle) {
    const socials = await audiusBackendInstance.getSocialHandles(handle)
    return socials.twitterHandle ? `@${socials.twitterHandle}` : handle
  }
  return twitterHandle ? `@${twitterHandle}` : handle
}

export const getTwitterShareText = async (content: ShareContent) => {
  switch (content.type) {
    case 'track': {
      const {
        track: { title },
        artist: { handle, twitter_handle: twitterHandle }
      } = content
      return messages.trackShareText(
        title,
        await getTwitterShareHandle({ handle, twitterHandle })
      )
    }
    case 'profile': {
      const {
        profile: { handle, twitter_handle: twitterHandle }
      } = content
      return messages.profileShareText(
        await getTwitterShareHandle({ handle, twitterHandle })
      )
    }
    case 'album': {
      const {
        album: { playlist_name },
        artist: { handle, twitter_handle: twitterHandle }
      } = content
      return messages.albumShareText(
        playlist_name,
        await getTwitterShareHandle({ handle, twitterHandle })
      )
    }
    case 'playlist': {
      const {
        playlist: { playlist_name },
        creator: { handle, twitter_handle: twitterHandle }
      } = content
      return messages.playlistShareText(
        playlist_name,
        await getTwitterShareHandle({ handle, twitterHandle })
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
