import { ComponentProps } from 'react'

import { Text } from '@audius/harmony'
import cn from 'classnames'
import { NavLink, NavLinkProps } from 'react-router-dom'
import { SetOptional } from 'type-fest'

import { Droppable, DroppableProps } from 'components/dragndrop'
import { selectDragnDropState } from 'store/dragndrop/slice'
import { useSelector } from 'utils/reducer'

import styles from './LeftNavLink.module.css'

export type LeftNavLinkProps =
  | { disabled?: boolean } & Omit<NavLinkProps, 'onDrop'>

export const LeftNavLink = (props: LeftNavLinkProps) => {
  const { disabled, children, className: classNameProp, ...other } = props
  const className = cn(classNameProp, styles.link, {
    [styles.disabledLink]: disabled
  })

  if ('to' in other) {
    return (
      <NavLink {...other} activeClassName='active' className={className}>
        <Text tag='span' size='s'>
          {children}
        </Text>
      </NavLink>
    )
  }
  return (
    <Text tag='div' {...other} className={className}>
      {children}
    </Text>
  )
}

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
