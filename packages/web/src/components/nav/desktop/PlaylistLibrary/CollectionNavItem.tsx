import { useCallback, useState, MouseEvent } from 'react'

import {
  Name,
  ID,
  cacheCollectionsActions,
  playlistLibraryActions,
  PlaylistLibraryKind,
  PlaylistLibraryID
} from '@audius/common'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { make, useRecord } from 'common/store/analytics/actions'
import { Draggable } from 'components/dragndrop'
import { open as openEditPlaylistModal } from 'store/application/ui/editPlaylistModal/slice'
import {
  DragDropKind,
  selectDraggingKind,
  selectDraggingId
} from 'store/dragndrop/slice'
import { useSelector } from 'utils/reducer'

import { LeftNavDroppable, LeftNavLink } from '../LeftNavLink'

import styles from './CollectionNavItem.module.css'
import { EditNavItemButton } from './EditNavItemButton'
import { PlaylistUpdateDot } from './PlaylistUpdateDot'

const { addTrackToPlaylist } = cacheCollectionsActions
const { reorder } = playlistLibraryActions

const messages = {
  editPlaylistLabel: 'Edit playlist'
}

const acceptedKinds: DragDropKind[] = [
  'track',
  'playlist',
  'library-playlist',
  'playlist-folder'
]

type CollectionNavItemProps = {
  id: PlaylistLibraryID
  name: string
  url: string
  isOwned: boolean
  level: number
  hasUpdate?: boolean
  onClick?: () => void
}

export const CollectionNavItem = (props: CollectionNavItemProps) => {
  const { id, name, url, isOwned, level, hasUpdate, onClick } = props
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const dispatch = useDispatch()
  const record = useRecord()

  const handleDragEnter = useCallback(() => {
    setIsDraggingOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false)
  }, [])

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [])

  const handleClickEdit = useCallback(
    (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      // Can only edit user owned playlists
      if (typeof id === 'number') {
        dispatch(openEditPlaylistModal(id))
        record(make(Name.PLAYLIST_OPEN_EDIT_FROM_LIBRARY, {}))
      }
    },
    [dispatch, id, record]
  )

  const handleDrop = useCallback(
    (draggingId: PlaylistLibraryID, kind: DragDropKind) => {
      if (kind === 'track') {
        dispatch(addTrackToPlaylist(draggingId as ID, id))
      } else {
        dispatch(
          reorder({
            draggingId,
            droppingId: id,
            draggingKind: kind as PlaylistLibraryKind
          })
        )
      }
    },
    [dispatch, id]
  )

  const draggingKind = useSelector(selectDraggingKind)
  const draggingId = useSelector(selectDraggingId)

  const isDisabled = (draggingKind === 'track' && !isOwned) || draggingId === id

  if (!name || !url) return null

  return (
    <LeftNavDroppable
      acceptedKinds={acceptedKinds}
      onDrop={handleDrop}
      disabled={isDisabled}
    >
      <Draggable id={id} text={name} link={url} kind='library-playlist'>
        <LeftNavLink
          to={url}
          onClick={onClick}
          disabled={isDisabled}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={styles.root}
        >
          {hasUpdate ? <PlaylistUpdateDot /> : null}
          <span
            className={cn(styles.collectionName, {
              [styles.playlistLevel1]: level === 1
            })}
          >
            {name}
          </span>
          <EditNavItemButton
            className={cn(styles.editPlaylistButton, {
              [styles.editable]: isOwned && isHovering && !isDraggingOver
            })}
            aria-label={messages.editPlaylistLabel}
            onClick={handleClickEdit}
          />
        </LeftNavLink>
      </Draggable>
    </LeftNavDroppable>
  )
}
