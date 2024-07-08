import cn from 'classnames'
import { SetOptional } from 'type-fest'

import { Droppable, DroppableProps } from 'components/dragndrop'
import { selectDragnDropState } from 'store/dragndrop/slice'
import { useSelector } from 'utils/reducer'

import styles from './LeftNavDroppable.module.css'

type LeftNavDroppableProps = SetOptional<
  DroppableProps,
  'hoverClassName' | 'activeClassName' | 'inactiveClassName'
>

export const LeftNavDroppable = (props: LeftNavDroppableProps) => {
  const { kind } = useSelector(selectDragnDropState)

  const hoverClassName =
    kind === 'track'
      ? styles.droppableLinkHoverTrack
      : styles.droppableLinkHoverPlaylist

  const activeClassName =
    kind === 'track'
      ? cn(styles.droppableLinkActive, 'droppableLinkActive')
      : undefined

  return (
    <Droppable
      className={styles.droppableLink}
      hoverClassName={hoverClassName}
      activeClassName={activeClassName}
      inactiveClassName={styles.droppableLinkInactive}
      {...props}
    />
  )
}
