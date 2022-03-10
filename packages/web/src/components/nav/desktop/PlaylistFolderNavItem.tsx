import React, { useCallback, useState } from 'react'

import {
  IconCaretRight,
  IconFolder,
  IconFolderOutline,
  IconKebabHorizontal
} from '@audius/stems'
import cn from 'classnames'
import { useSpring, animated } from 'react-spring'
import useMeasure from 'react-use-measure'

import { ID } from 'common/models/Identifiers'
import { PlaylistLibraryFolder } from 'common/models/PlaylistLibrary'
import { SmartCollectionVariant } from 'common/models/SmartCollectionVariant'
import Draggable from 'components/dragndrop/Draggable'
import Droppable from 'components/dragndrop/Droppable'
import IconButton from 'components/icon-button/IconButton'

import navColumnStyles from './NavColumn.module.css'
import styles from './PlaylistLibrary.module.css'

type PlaylistFolderNavButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  onReorder: () => void
}

const FolderNavLink = ({
  id,
  name,
  onReorder,
  children,
  className,
  ...buttonProps
}: PlaylistFolderNavButtonProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const onDrag = useCallback(() => {
    setIsDragging(true)
  }, [setIsDragging])
  const onDrop = useCallback(() => {
    setIsDragging(false)
  }, [setIsDragging])

  return (
    <Droppable
      key={id}
      className={styles.droppable}
      hoverClassName={styles.droppableHover}
      onDrop={(id: ID | SmartCollectionVariant) => onReorder()}
      acceptedKinds={['library-playlist', 'playlist-folder']}
    >
      <Draggable
        id={id}
        text={name}
        kind='playlist-folder'
        onDrag={onDrag}
        onDrop={onDrop}
      >
        <button
          {...buttonProps}
          draggable={false}
          className={cn(className, styles.navLink, {
            [styles.dragging]: isDragging
          })}
        >
          {children}
        </button>
      </Draggable>
    </Droppable>
  )
}

type PlaylistFolderNavItemProps = {
  folder: PlaylistLibraryFolder
  hasUpdate: boolean
  dragging: boolean
  draggingKind: string
  onClickEdit: (folderId: string) => void
  children?: React.ReactNode
}

export const PlaylistFolderNavItem = ({
  folder,
  hasUpdate = false,
  dragging,
  draggingKind,
  onClickEdit,
  children
}: PlaylistFolderNavItemProps) => {
  const { id, name } = folder
  const isDroppableKind =
    draggingKind === 'track' ||
    draggingKind === 'playlist' ||
    draggingKind === 'playlist-folder'
  const [isHovering, setIsHovering] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [ref, bounds] = useMeasure()
  const contentsStyle = useSpring({
    height: isExpanded ? bounds.height : 0,
    opacity: isExpanded ? 100 : 0,
    overflow: 'hidden'
  })

  return (
    <Droppable
      key={id}
      className={navColumnStyles.droppable}
      hoverClassName={navColumnStyles.droppableHover}
      onDrop={() => {}}
      acceptedKinds={['library-playlist']}
    >
      <FolderNavLink
        onMouseEnter={() => {
          setIsHovering(true)
        }}
        onMouseLeave={() => setIsHovering(false)}
        id={id}
        name={name}
        onReorder={() => {}}
        className={cn(navColumnStyles.link, navColumnStyles.editable, {
          [navColumnStyles.droppableLink]: dragging && isDroppableKind,
          [navColumnStyles.disabledLink]:
            dragging && !isDroppableKind && draggingKind !== 'library-playlist'
        })}
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          setIsExpanded(!isExpanded)
        }}
      >
        <div className={styles.libraryLinkContentContainer}>
          {children == null ? (
            <IconFolderOutline
              width={12}
              height={12}
              className={styles.iconFolder}
            />
          ) : (
            <IconFolder
              width={12}
              height={12}
              className={cn(styles.iconFolder, {
                [styles.iconFolderUpdated]: hasUpdate
              })}
            />
          )}
          <div className={styles.libraryLinkTextContainer}>
            <span>{name}</span>
          </div>
          <IconCaretRight
            height={11}
            width={11}
            className={cn(styles.iconCaret, {
              [styles.iconCaretDown]: isExpanded
            })}
          />
          <IconButton
            className={cn(styles.iconKebabHorizontal, {
              [styles.hidden]: !isHovering || dragging
            })}
            icon={<IconKebabHorizontal height={11} width={11} />}
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              onClickEdit(id)
            }}
          />
        </div>
      </FolderNavLink>
      {children == null ? null : (
        <animated.div style={contentsStyle}>
          <div ref={ref}>{children}</div>
        </animated.div>
      )}
    </Droppable>
  )
}
