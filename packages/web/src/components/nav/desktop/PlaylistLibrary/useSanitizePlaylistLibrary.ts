import { useEffect } from 'react'

import { useUpdatePlaylistLibrary } from '@audius/common/api'
import { PlaylistLibraryFolder } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'

import { useSelector } from 'utils/reducer'
const { getPlaylistLibrary } = accountSelectors

export const useSanitizePlaylistLibrary = () => {
  const library = useSelector(getPlaylistLibrary)
  const { mutate: updatePlaylistLibrary } = useUpdatePlaylistLibrary()

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
      updatePlaylistLibrary(newLibrary)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!library, updatePlaylistLibrary])
}
