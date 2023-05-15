import { accountSelectors } from '@audius/common'
import { isEmpty } from 'lodash'

import { useSelector } from 'utils/reducer'

import { EmptyLibraryNavLink } from './EmptyLibraryNavLink'
import { PlaylistLibraryNavItem, keyExtractor } from './PlaylistLibraryNavItem'
import { useAddAudioNftPlaylistToLibrary } from './useAddAudioNftPlaylistToLibrary'
const { getPlaylistLibrary } = accountSelectors

export const PlaylistLibrary = () => {
  useAddAudioNftPlaylistToLibrary()
  const library = useSelector(getPlaylistLibrary)

  if (!library || isEmpty(library?.contents)) {
    return <EmptyLibraryNavLink />
  }

  return (
    <>
      {library.contents.map((content) => (
        <PlaylistLibraryNavItem
          key={keyExtractor(content)}
          item={content}
          level={0}
        />
      ))}
    </>
  )
}
