import { MutableRefObject, useCallback } from 'react'

import { accountSelectors, collectionsSocialActions } from '@audius/common'
import { FavoriteSource } from '@audius/common/models'
import cn from 'classnames'
import { isEmpty } from 'lodash'
import { useDispatch } from 'react-redux'

import { Droppable } from 'components/dragndrop'
import { DragDropKind, selectDraggingKind } from 'store/dragndrop/slice'
import { useSelector } from 'utils/reducer'

import { GroupHeader } from '../GroupHeader'

import { CreatePlaylistLibraryItemButton } from './CreatePlaylistLibraryItemButton'
import { EmptyLibraryNavLink } from './EmptyLibraryNavLink'
import styles from './PlaylistLibrary.module.css'
import { PlaylistLibraryNavItem, keyExtractor } from './PlaylistLibraryNavItem'
import { useAddAudioNftPlaylistToLibrary } from './useAddAudioNftPlaylistToLibrary'
import { useSanitizePlaylistLibrary } from './useSanitizePlaylistLibrary'

const { getPlaylistLibrary } = accountSelectors
const { saveCollection } = collectionsSocialActions

const messages = {
  header: 'Playlists',
  new: 'New',
  newPlaylist: 'New Playlist',
  newPlaylistOrFolderTooltip: 'New Playlist or Folder'
}

const acceptedKinds: DragDropKind[] = ['playlist']

type PlaylistLibraryProps = {
  scrollbarRef: MutableRefObject<HTMLElement | null>
}

export const PlaylistLibrary = (props: PlaylistLibraryProps) => {
  const { scrollbarRef } = props
  const library = useSelector(getPlaylistLibrary)
  const dispatch = useDispatch()
  const draggingKind = useSelector(selectDraggingKind)

  useAddAudioNftPlaylistToLibrary()
  useSanitizePlaylistLibrary()

  const handleDrop = useCallback(
    (collectionId: number) => {
      dispatch(saveCollection(collectionId, FavoriteSource.NAVIGATOR))
    },
    [dispatch]
  )

  return (
    <Droppable
      className={styles.droppable}
      hoverClassName={styles.droppableHover}
      onDrop={handleDrop}
      acceptedKinds={acceptedKinds}
    >
      <GroupHeader
        className={cn(styles.header, {
          [styles.droppableLink]: draggingKind === 'playlist'
        })}
      >
        {messages.header}
        <CreatePlaylistLibraryItemButton scrollbarRef={scrollbarRef} />
      </GroupHeader>
      {!library || isEmpty(library?.contents) ? (
        <EmptyLibraryNavLink />
      ) : (
        library.contents.map((content) => (
          <PlaylistLibraryNavItem
            key={keyExtractor(content)}
            item={content}
            level={0}
          />
        ))
      )}
    </Droppable>
  )
}
