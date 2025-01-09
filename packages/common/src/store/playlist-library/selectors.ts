import { getPlaylistLibrary } from '~/store/account/selectors'

import { CommonState } from '../reducers'

export const selectFolder = (state: CommonState, folderId: string) => {
  const playlistLibrary = getPlaylistLibrary(state)
  if (!playlistLibrary) return null
  return playlistLibrary.contents.find(
    (item) => item.type === 'folder' && item.id === folderId
  )
}
