import { useCallback } from 'react'

import { FavoriteSource } from '@audius/common/models'
import {
  accountSelectors,
  collectionsSocialActions
} from '@audius/common/store'
import { Flex, IconPlaylists, Text, useTheme } from '@audius/harmony'
import { ClassNames } from '@emotion/react'
import { isEmpty } from 'lodash'
import { useDispatch } from 'react-redux'

import { Droppable } from 'components/dragndrop'
import { DragDropKind } from 'store/dragndrop/slice'
import { useSelector } from 'utils/reducer'

import { PlaylistLibraryNavItem, keyExtractor } from './PlaylistLibraryNavItem'
import { useAddAudioNftPlaylistToLibrary } from './useAddAudioNftPlaylistToLibrary'
import { useSanitizePlaylistLibrary } from './useSanitizePlaylistLibrary'
const { getPlaylistLibrary } = accountSelectors
const { saveCollection } = collectionsSocialActions

const acceptedKinds: DragDropKind[] = ['playlist']

type PlaylistLibraryProps = {
  isExpanded: boolean
}

export const PlaylistLibrary = ({ isExpanded }: PlaylistLibraryProps) => {
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
        <Flex
          direction='column'
          css={{
            position: 'relative',
            maxHeight: '100%',
            overflow: 'visible'
          }}
          data-testid='playlist-library-container'
        >
          <Droppable
            className={css({
              position: 'relative',
              '::before': {
                content: '""',
                position: 'absolute',
                top: -spacing.s,
                bottom: -spacing.s,
                left: 0,
                right: 0,
                backgroundColor: color.background.accent,
                transition: `opacity ${motion.quick}`,
                opacity: 0,
                pointerEvents: 'none'
              },
              '&.droppableLinkHover::before': {
                opacity: 0.15
              }
            })}
            hoverClassName='droppableLinkHover'
            onDrop={handleDrop}
            acceptedKinds={acceptedKinds}
            data-testid='playlist-library-droppable'
          >
            <Flex
              alignItems='center'
              gap='s'
              css={{ width: '100%' }}
              data-testid='playlist-library-header'
            >
              <IconPlaylists size='s' color='default' />
              <Text variant='title' size='s'>
                Playlists
              </Text>
              <Text variant='label' size='l' css={{ marginLeft: 'auto' }}>
                +
              </Text>
            </Flex>
            {isExpanded && (
              <Flex
                direction='column'
                css={{
                  overflow: 'hidden auto',
                  marginLeft: spacing.s
                }}
              >
                {!library || isEmpty(library?.contents)
                  ? null
                  : library.contents.map((content) => (
                      <PlaylistLibraryNavItem
                        key={keyExtractor(content)}
                        item={content}
                        level={0}
                      />
                    ))}
              </Flex>
            )}
          </Droppable>
        </Flex>
      )}
    </ClassNames>
  )
}
