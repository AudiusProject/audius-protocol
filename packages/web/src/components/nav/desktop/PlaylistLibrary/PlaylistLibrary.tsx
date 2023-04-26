import { accountSelectors } from '@audius/common'
import cn from 'classnames'
import { isEmpty } from 'lodash'

import { useSelector } from 'utils/reducer'

import leftNavStyles from '../LeftNav.module.css'

import { PlaylistLibraryNavItem, keyExtractor } from './PlaylistLibraryNavItem'
import { useAddAudioNftPlaylistToLibrary } from './useAddAudioNftPlaylistToLibrary'
const { getPlaylistLibrary } = accountSelectors

export const PlaylistLibrary = () => {
  useAddAudioNftPlaylistToLibrary()
  const library = useSelector(getPlaylistLibrary)

  if (!library || isEmpty(library?.contents)) {
    return (
      <div className={cn(leftNavStyles.link, leftNavStyles.disabled)}>
        Create your first playlist!
      </div>
    )
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
