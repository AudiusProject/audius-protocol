import { useCallback, useState, MouseEvent } from 'react'

import {
  ID,
  SmartCollectionVariant,
  AccountCollection,
  PlaylistLibraryID
} from '@audius/common'
import { IconKebabHorizontal, IconButton } from '@audius/stems'
import cn from 'classnames'
import { NavLink, NavLinkProps } from 'react-router-dom'

import { Draggable, Droppable } from 'components/dragndrop'
import Tooltip from 'components/tooltip/Tooltip'
import UpdateDot from 'components/update-dot/UpdateDot'
import { DragDropKind } from 'store/dragndrop/slice'
import { getPathname } from 'utils/route'

import leftNavStyles from './LeftNav.module.css'
import styles from './PlaylistLibrary.module.css'

const messages = { recentlyUpdatedTooltip: 'Recently Updated' }

type PlaylistNavLinkProps = NavLinkProps & {
  droppableKey: ID | SmartCollectionVariant
  playlistId: ID | SmartCollectionVariant
  name: string
  onReorder: (
    draggingId: ID | SmartCollectionVariant | string,
    droppingId: ID | SmartCollectionVariant | string,
    draggingKind: DragDropKind
  ) => void
  link?: string
  isInsideFolder?: boolean
}

export const PlaylistNavLink = ({
  droppableKey,
  playlistId,
  name,
  link,
  onReorder,
  children,
  className,
  isInsideFolder,
  ...navLinkProps
}: PlaylistNavLinkProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const onDrag = useCallback(() => {
    setIsDragging(true)
  }, [setIsDragging])
  const onDrop = useCallback(() => {
    setIsDragging(false)
  }, [setIsDragging])
  return (
    <Droppable
      key={droppableKey}
      className={styles.droppable}
      hoverClassName={styles.droppableHover}
      onDrop={(id: PlaylistLibraryID | string, draggingKind: DragDropKind) => {
        onReorder(id, playlistId, draggingKind)
      }}
      stopPropagationOnDrop
      acceptedKinds={
        isInsideFolder
          ? ['library-playlist']
          : ['library-playlist', 'playlist-folder']
      }
    >
      <Draggable
        id={playlistId}
        text={name}
        link={link}
        kind='library-playlist'
        onDrag={onDrag}
        onDrop={onDrop}
      >
        <NavLink
          {...navLinkProps}
          draggable={false}
          className={cn(className, styles.navLink, {
            [styles.dragging]: isDragging
          })}
        >
          {children}
        </NavLink>
      </Draggable>
    </Droppable>
  )
}

type PlaylistNavItemProps = {
  playlist: AccountCollection
  url: string
  addTrack: (trackId: ID) => void
  isOwner: boolean
  onReorder: (
    draggingId: ID | SmartCollectionVariant | string,
    droppingId: ID | SmartCollectionVariant | string,
    draggingKind: DragDropKind
  ) => void
  hasUpdate?: boolean
  dragging: boolean
  draggingKind: string
  onClickPlaylist: (e: MouseEvent, id: ID, hasUpdate: boolean) => void
  onClickEdit?: (id: ID) => void
  isInsideFolder?: boolean
}
export const PlaylistNavItem = ({
  playlist,
  hasUpdate = false,
  url,
  addTrack,
  isOwner,
  onReorder,
  dragging,
  draggingKind,
  onClickPlaylist,
  onClickEdit,
  isInsideFolder
}: PlaylistNavItemProps) => {
  const { id, name } = playlist
  const [isHovering, setIsHovering] = useState(false)

  return (
    <Droppable
      key={id}
      className={leftNavStyles.droppable}
      hoverClassName={leftNavStyles.droppableHover}
      onDrop={addTrack}
      acceptedKinds={['track']}
      disabled={!isOwner}
    >
      <PlaylistNavLink
        isInsideFolder={isInsideFolder}
        droppableKey={id}
        playlistId={id}
        name={name}
        link={url}
        to={url}
        onReorder={onReorder}
        isActive={() => url === getPathname()}
        activeClassName='active'
        className={cn(leftNavStyles.link, {
          [leftNavStyles.droppableLink]:
            isOwner &&
            dragging &&
            (draggingKind === 'track' || draggingKind === 'playlist'),
          [leftNavStyles.editable]: isOwner && onClickEdit != null,
          [leftNavStyles.disabledLink]:
            dragging &&
            ((draggingKind !== 'track' &&
              draggingKind !== 'playlist' &&
              draggingKind !== 'library-playlist') ||
              !isOwner)
        })}
        onClick={(e) => onClickPlaylist(e, id, hasUpdate)}
        onMouseEnter={() => {
          setIsHovering(true)
        }}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className={styles.libraryLinkContentContainer}>
          {!hasUpdate ? null : (
            <div className={leftNavStyles.updateDotContainer}>
              <Tooltip
                className={leftNavStyles.updateDotTooltip}
                shouldWrapContent={true}
                shouldDismissOnClick={false}
                mouseEnterDelay={0.1}
                text={messages.recentlyUpdatedTooltip}
              >
                <div>
                  <UpdateDot />
                </div>
              </Tooltip>
            </div>
          )}
          <div className={styles.libraryLinkTextContainer}>
            <span>{name}</span>
          </div>
          {!isOwner || !onClickEdit ? null : (
            <IconButton
              aria-label='Edit playlist'
              className={cn(styles.iconKebabHorizontal, {
                [styles.hidden]: !isHovering || dragging
              })}
              icon={<IconKebabHorizontal height={11} width={11} />}
              onClick={(event: MouseEvent) => {
                event.preventDefault()
                event.stopPropagation()
                onClickEdit(id)
              }}
            />
          )}
        </div>
      </PlaylistNavLink>
    </Droppable>
  )
}
