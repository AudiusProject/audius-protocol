import {
  useState,
  useCallback,
  ReactElement,
  DragEvent,
  ReactNode
} from 'react'

import { ID } from '@audius/common'
import { useDebouncedCallback } from '@audius/common/hooks'
import { Slot } from '@radix-ui/react-slot'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { DragDropKind, selectDragnDropState } from 'store/dragndrop/slice'

import styles from './Droppable.module.css'

export type DroppableProps = {
  className?: string
  hoverClassName: string
  activeClassName?: string
  inactiveClassName?: string
  onDrop:
    | ((id: ID, kind: DragDropKind, index: number) => void)
    | ((id: string, kind: DragDropKind, index: number) => void)
  acceptedKinds: Array<DragDropKind>
  disabled?: boolean
  // Allows kinds owned by currentUser to be dropped
  acceptOwner?: boolean
} & (
  | {
      asChild: true
      children: ReactElement
    }
  | { asChild?: false; children: ReactNode }
)

export const Droppable = (props: DroppableProps) => {
  const {
    className,
    hoverClassName,
    activeClassName = '',
    inactiveClassName = '',
    onDrop,
    acceptedKinds = ['track', 'album', 'playlist', 'library-playlist'],
    disabled,
    acceptOwner = true,
    children,
    asChild,
    ...other
  } = props
  const { id, kind, index, isOwner } = useSelector(selectDragnDropState)
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

  const handleDragOver = useCallback((e: DragEvent) => {
    setHovered(true)
    e.preventDefault()
  }, [])

  const handleDragLeave = useCallback(() => {
    setHovered(false)
  }, [])

  const handleDrop = useDebouncedCallback(
    (e: DragEvent) => {
      // This is the only way event bubbling could be prevented
      if (e.nativeEvent.defaultPrevented) return
      e.preventDefault()
      if (id) {
        // @ts-ignore table expects index to be there
        onDrop(id, kind, index)
      }
      setHovered(false)
    },
    [id, kind, onDrop, index],
    150
  )

  const droppableProps = canDrop
    ? {
        onDragEnter: handleDragEnter,
        onDragLeave: handleDragLeave,
        onDragOver: handleDragOver,
        onDrop: handleDrop
      }
    : {}

  const Comp = asChild ? Slot : 'div'

  return (
    <Comp
      className={cn(styles.droppable, className, {
        [activeClassName]: canDrop,
        [inactiveClassName]: kind && !canDrop,
        [hoverClassName]: hovered && canDrop
      })}
      {...droppableProps}
      {...other}
    >
      {children}
    </Comp>
  )
}
