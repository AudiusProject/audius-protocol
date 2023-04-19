import { useState, useRef, useEffect, ReactNode, useCallback } from 'react'

import { ID, useDebouncedCallback } from '@audius/common'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { DragDropKind, selectDragnDropState } from 'store/dragndrop/slice'

import styles from './Droppable.module.css'

type DroppableProps = {
  className?: string
  hoverClassName: string
  onDrop:
    | ((id: ID, kind: DragDropKind, index: number) => void)
    | ((id: string, kind: DragDropKind, index: number) => void)
  acceptedKinds: Array<DragDropKind>
  disabled?: boolean
  // Allows kinds owned by currentUser to be dropped
  acceptOwner?: boolean
  children?: ReactNode
  stopPropagationOnDrop?: boolean
}

export const Droppable = (props: DroppableProps) => {
  const {
    className,
    hoverClassName,
    onDrop,
    acceptedKinds = ['track', 'album', 'playlist', 'library-playlist'],
    disabled,
    acceptOwner = true,
    children,
    stopPropagationOnDrop
  } = props
  const { id, kind, index, isOwner } = useSelector(selectDragnDropState)
  const droppableRef = useRef<HTMLDivElement | null>(null)
  const [hovered, setHovered] = useState(false)

  /**
   * Whether or not the currently dragged kind is accepted by this droppable.
   * Conditions include:
   * 1.) Must be accepted kind track/album/plylist
   * 2.) Must not be disabled
   * 3.) Either accept owner or the dragging entity if not owned by user
   */
  const canDrop =
    kind &&
    acceptedKinds.includes(kind) &&
    !disabled &&
    (acceptOwner || !isOwner)

  const handleDragEnter = useCallback((e: DragEvent) => {
    const dt = e.dataTransfer
    if (dt) {
      dt.dropEffect = 'copy'
    }
    setHovered(true)
  }, [])

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      if (!hovered) setHovered(true)
      e.preventDefault()
    },
    [hovered]
  )

  const handleDragLeave = useCallback(() => {
    setHovered(false)
  }, [])

  const handleDrop = useDebouncedCallback(
    (e: DragEvent) => {
      if (stopPropagationOnDrop) {
        e.stopPropagation()
      }
      if (id) {
        // @ts-ignore table expects index to be there
        onDrop(id, kind, index)
      }
      setHovered(false)
    },
    150,
    [stopPropagationOnDrop, id, kind, onDrop, index]
  )

  // When a new drag takes place, check if this droppable is appropriate and reattach
  // event listeners.
  useEffect(() => {
    const droppableElement = droppableRef.current

    if (canDrop && droppableElement) {
      droppableElement.addEventListener('dragenter', handleDragEnter, false)
      droppableElement.addEventListener('dragleave', handleDragLeave, false)
      droppableElement.addEventListener('dragover', handleDragOver, false)
      droppableElement.addEventListener('drop', handleDrop, false)

      return () => {
        droppableElement.removeEventListener(
          'dragenter',
          handleDragEnter,
          false
        )
        droppableElement.removeEventListener(
          'dragleave',
          handleDragLeave,
          false
        )
        droppableElement.removeEventListener('dragover', handleDragOver, false)
        droppableElement.removeEventListener('drop', handleDrop, false)
      }
    }
  }, [canDrop, handleDragEnter, handleDragLeave, handleDragOver, handleDrop])

  return (
    <div
      ref={droppableRef}
      className={cn(styles.droppable, className, {
        [hoverClassName]: hovered && canDrop
      })}
    >
      {children}
    </div>
  )
}
