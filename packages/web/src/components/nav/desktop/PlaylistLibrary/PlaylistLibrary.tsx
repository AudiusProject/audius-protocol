import { MutableRefObject, useCallback } from 'react'

import { FavoriteSource } from '@audius/common/models'
import {
  accountSelectors,
  collectionsSocialActions
} from '@audius/common/store'
import { Flex, motion } from '@audius/harmony'
import { ClassNames } from '@emotion/react'
import { isEmpty } from 'lodash'
import { useDispatch } from 'react-redux'

import { Droppable } from 'components/dragndrop'
import { DragDropKind, selectDraggingKind } from 'store/dragndrop/slice'
import { useSelector } from 'utils/reducer'

import { GroupHeader } from '../GroupHeader'

import { CreatePlaylistLibraryItemButton } from './CreatePlaylistLibraryItemButton'
import { EmptyLibraryNavLink } from './EmptyLibraryNavLink'
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
    <ClassNames>
      {({ css }) => (
        <Droppable
          className={css({
            borderRadius: 6,
            paddingTop: -10,
            marginTop: -10,
            transition: `background ${motion.quick}`
          })}
          hoverClassName={css({ backgroundColor: 'rgba(152, 73, 214, 0.15)' })}
          onDrop={handleDrop}
          acceptedKinds={acceptedKinds}
        >
          <Flex wrap='nowrap' alignItems='center' gap='s'>
            <GroupHeader
              color={draggingKind === 'playlist' ? 'accent' : 'subdued'}
            >
              {messages.header}
            </GroupHeader>
            <CreatePlaylistLibraryItemButton scrollbarRef={scrollbarRef} />
          </Flex>
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
      )}
    </ClassNames>
  )
}
