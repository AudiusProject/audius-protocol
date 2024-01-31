import { getUserId } from '~/store/account/selectors'
import { getUser } from '~/store/cache/users/selectors'

import { CommonState } from '../reducers'

export const selectFolder = (state: CommonState, folderId: string) => {
  const accountId = getUserId(state)
  const playlistLibrary = getUser(state, { id: accountId })?.playlist_library
  if (!playlistLibrary) return null
  return playlistLibrary.contents.find(
    (item) => item.type === 'folder' && item.id === folderId
  )
}
