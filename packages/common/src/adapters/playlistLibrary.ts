import { full } from '@audius/sdk'

import {
  PlaylistLibrary,
  PlaylistLibraryItem,
  PlaylistUpdate
} from '~/models/PlaylistLibrary'
import { decodeHashId } from '~/utils'

export const playlistLibraryFromSDK = (
  input?: full.PlaylistLibrary
): PlaylistLibrary | undefined => {
  if (!input) return undefined
  return {
    contents: input.contents as PlaylistLibraryItem[]
  }
}

export const playlistUpdateFromSDK = (
  input: full.PlaylistUpdate
): PlaylistUpdate | undefined => {
  const playlist_id = decodeHashId(input.playlistId)
  return playlist_id
    ? {
        playlist_id,
        updated_at: input.updatedAt,
        last_seen_at: input.lastSeenAt ?? null
      }
    : undefined
}
