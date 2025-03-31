import { useCallback } from 'react'

import { FavoriteSource } from '@audius/common/models'
import {
  accountSelectors,
  collectionsSocialActions
} from '@audius/common/store'
import { useTheme } from '@audius/harmony'
import { ClassNames } from '@emotion/react'
import { isEmpty } from 'lodash'
import { useDispatch } from 'react-redux'

import { Droppable } from 'components/dragndrop'
import { DragDropKind } from 'store/dragndrop/slice'
import { useSelector } from 'utils/reducer'

import { EmptyLibraryNavLink } from './EmptyLibraryNavLink'
import { PlaylistLibraryNavItem, keyExtractor } from './PlaylistLibraryNavItem'
import { useAddAudioNftPlaylistToLibrary } from './useAddAudioNftPlaylistToLibrary'
import { useSanitizePlaylistLibrary } from './useSanitizePlaylistLibrary'

const { getPlaylistLibrary } = accountSelectors
const { saveCollection } = collectionsSocialActions

const acceptedKinds: DragDropKind[] = ['playlist']

export const PlaylistLibrary = () => {
  const library = useSelector(getPlaylistLibrary)
  const dispatch = useDispatch()
  const { color, motion, spacing } = useTheme()

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
            position: 'relative',
            // Drop Background
            '::before': {
              content: '""',
              position: 'absolute',
              top: -spacing.s,
              bottom: -spacing.s,
              left: 0,
              right: 0,
              backgroundColor: color.background.accent,
              transition: `opacity ${motion.quick}`,
              opacity: 0
            },
            '&.droppableLinkHover::before': {
              opacity: 0.15
            }
          })}
          hoverClassName='droppableLinkHover'
          onDrop={handleDrop}
          acceptedKinds={acceptedKinds}
        >
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
