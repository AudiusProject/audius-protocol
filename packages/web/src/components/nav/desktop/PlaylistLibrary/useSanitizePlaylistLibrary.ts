import { useEffect } from 'react'

import { PlaylistLibraryFolder } from '@audius/common/models'
import { accountSelectors, playlistLibraryActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { useSelector } from 'utils/reducer'
const { getPlaylistLibrary } = accountSelectors
const { update: updatePlaylistLibrary } = playlistLibraryActions

export const useSanitizePlaylistLibrary = () => {
  const library = useSelector(getPlaylistLibrary)
  const dispatch = useDispatch()

  useEffect(() => {
    if (!library) return
    let hasIssue = false

    const newLibrary = { ...library }

    // checks for issue where folders are incorrectly represented as playlists
    newLibrary.contents = newLibrary.contents.map((content) => {
      if ('contents' in content && content.type !== 'folder') {
        hasIssue = true
        const { id, name, contents } = content as PlaylistLibraryFolder
        return { id, name, contents, type: 'folder' }
      }
      return content
    })

    if (hasIssue) {
      dispatch(updatePlaylistLibrary({ playlistLibrary: newLibrary }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!library, dispatch])
}
