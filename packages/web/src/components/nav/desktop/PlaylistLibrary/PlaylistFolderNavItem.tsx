import { useCallback, useState, MouseEvent, useEffect, useMemo } from 'react'

import {
  Name,
  PlaylistLibraryID,
  PlaylistLibraryKind,
  PlaylistLibraryFolder
} from '@audius/common/models'
import {
  playlistLibraryActions,
  modalsActions,
  playlistUpdatesSelectors
} from '@audius/common/store'
import {
  IconFolder,
  IconCaretRight,
  PopupMenuItem,
  Flex,
  Text,
  useTheme
} from '@audius/harmony'
import { ClassNames } from '@emotion/react'
import { useDispatch } from 'react-redux'
import { useToggle } from 'react-use'

import { make, useRecord } from 'common/store/analytics/actions'
import { Draggable, Droppable } from 'components/dragndrop'
import { setFolderId as setEditFolderModalFolderId } from 'store/application/ui/editFolderModal/slice'
import { DragDropKind, selectDraggingKind } from 'store/dragndrop/slice'
import { useSelector } from 'utils/reducer'

import { LeftNavLink } from '../LeftNavLink'

import { DeleteFolderConfirmationModal } from './DeleteFolderConfirmationModal'
import { NavItemKebabButton } from './NavItemKebabButton'
import { PlaylistLibraryNavItem, keyExtractor } from './PlaylistLibraryNavItem'
const { setVisibility } = modalsActions
const { addToFolder } = playlistLibraryActions
const { selectPlaylistUpdateById } = playlistUpdatesSelectors

type PlaylistFolderNavItemProps = {
  folder: PlaylistLibraryFolder
  level: number
}

const longDragTimeoutMs = 1000

const acceptedKinds: DragDropKind[] = ['playlist', 'library-playlist']

const messages = {
  editFolderLabel: 'More folder actions',
  edit: 'Edit',
  delete: 'Delete'
}

export const PlaylistFolderNavItem = (props: PlaylistFolderNavItemProps) => {
  const { folder, level } = props
  const { name, contents, id } = folder
  const folderHasUpdate = useSelector((state) => {
    return folder.contents.some(
      (content) =>
        content.type === 'playlist' &&
        selectPlaylistUpdateById(state, content.playlist_id)
    )
  })
  const { color, motion } = useTheme()
  const draggingKind = useSelector(selectDraggingKind)
  const [isExpanded, toggleIsExpanded] = useToggle(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const dispatch = useDispatch()
  const record = useRecord()
  const [isDeleteConfirmationOpen, toggleDeleteConfirmationOpen] =
    useToggle(false)

  const isDisabled = draggingKind && !acceptedKinds.includes(draggingKind)

  const handleDrop = useCallback(
    (id: PlaylistLibraryID, kind: DragDropKind) => {
      dispatch(
        addToFolder({
          folder,
          draggingId: id,
          draggingKind: kind as PlaylistLibraryKind
        })
      )
    },
    [dispatch, folder]
  )

  const handleDragEnter = useCallback(() => {
    if (!isDisabled) {
      setIsDraggingOver(true)
    }
  }, [isDisabled])

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false)
  }, [])

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsDraggingOver(false)
    setIsHovering(false)
  }, [])

  const handleClickEdit = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      dispatch(setEditFolderModalFolderId(id))
      dispatch(setVisibility({ modal: 'EditFolder', visible: true }))
      record(make(Name.FOLDER_OPEN_EDIT, {}))
    },
    [dispatch, id, record]
  )

  const kebabItems: PopupMenuItem[] = useMemo(
    () => [
      { text: messages.edit, onClick: handleClickEdit },
      { text: messages.delete, onClick: toggleDeleteConfirmationOpen }
    ],
    [handleClickEdit, toggleDeleteConfirmationOpen]
  )

  useEffect(() => {
    if (isDraggingOver && !isExpanded) {
      const longDragTimeout = setTimeout(toggleIsExpanded, longDragTimeoutMs)
      return () => clearTimeout(longDragTimeout)
    }
  }, [isDraggingOver, isExpanded, toggleIsExpanded])

  return (
    <ClassNames>
      {({ css }) => (
        <Droppable
          acceptedKinds={acceptedKinds}
          onDrop={handleDrop}
          className={css({
            position: 'relative',
            // Drop Background
            '::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              bottom: 0,
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
          disabled={isDisabled}
        >
          <Draggable id={id} text={name} kind='playlist-folder'>
            <LeftNavLink
              css={[
                { display: 'flex', alignItems: 'center' },
                isDraggingOver && { '& > *': { pointerEvents: 'none' } }
              ]}
              // NavLink requires as to param to allow for onClick, but it is not used
              onClick={toggleIsExpanded}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              disabled={isDisabled}
            >
              <Flex alignItems='center' w='100%' gap='xs'>
                <IconFolder
                  size='xs'
                  color={folderHasUpdate ? 'accent' : 'default'}
                />
                <Flex
                  flex={1}
                  gap='xs'
                  alignItems='center'
                  justifyContent='flex-start'
                  css={{ overflow: 'hidden' }}
                >
                  <Text size='s' ellipses>
                    {name}
                  </Text>
                  <NavItemKebabButton
                    visible={isHovering && !isDraggingOver}
                    aria-label={messages.editFolderLabel}
                    onClick={handleClickEdit}
                    items={kebabItems}
                  />
                </Flex>
                <IconCaretRight
                  size='2xs'
                  color='default'
                  css={{
                    flexShrink: 0,
                    transition: `transform 0.15s ease`,
                    transform: isExpanded ? `rotate(90deg)` : undefined
                  }}
                />
                <DeleteFolderConfirmationModal
                  folderId={id}
                  visible={isDeleteConfirmationOpen}
                  onCancel={toggleDeleteConfirmationOpen}
                />
              </Flex>
            </LeftNavLink>
            {isExpanded ? (
              <ul>
                {contents.map((content) => (
                  <PlaylistLibraryNavItem
                    key={keyExtractor(content)}
                    item={content}
                    level={level + 1}
                  />
                ))}
              </ul>
            ) : null}
          </Draggable>
        </Droppable>
      )}
    </ClassNames>
  )
}
