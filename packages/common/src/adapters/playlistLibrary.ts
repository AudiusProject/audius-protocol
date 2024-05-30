import { full } from '@audius/sdk'

import { PlaylistLibrary, PlaylistLibraryItem } from '~/models/PlaylistLibrary'

export const playlistLibraryFromSDK = (
  input?: full.PlaylistLibrary
): PlaylistLibrary | undefined => {
  if (!input) return undefined
  return {
    contents: input.contents as PlaylistLibraryItem[]
  }
}
