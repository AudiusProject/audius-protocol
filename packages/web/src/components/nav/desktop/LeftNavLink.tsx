import { ComponentProps } from 'react'

import { Text, TextProps, spacing } from '@audius/harmony'
import { CSSInterpolation } from '@emotion/css'
import { Interpolation, Theme } from '@emotion/react'
import { Slot } from '@radix-ui/react-slot'
import cn from 'classnames'
import { NavLink, NavLinkProps } from 'react-router-dom'
import { SetOptional } from 'type-fest'

import { Droppable, DroppableProps } from 'components/dragndrop'
import { selectDragnDropState } from 'store/dragndrop/slice'
import { useSelector } from 'utils/reducer'

import styles from './LeftNavLink.module.css'

export type LeftNavLinkProps =
  | { disabled?: boolean; asChild?: boolean } & (
      | Omit<NavLinkProps, 'onDrop'>
      | Omit<ComponentProps<'div'>, 'onDrop'>
    )

const indicatorCss: CSSInterpolation = {
  content: '""',
  display: 'block',
  width: '20px',
  height: '20px',
  position: 'absolute',
  top: 0,
  bottom: 0,
  margin: 'auto 0',
  left: '-16px',
  borderRadius: '4px'
}

const linkInteractionCss: CSSInterpolation = {
  '&:hover': {
    cursor: 'pointer',
    color: 'var(--harmony-n-950)'
  },
  '&:hover:before': [
    indicatorCss,
    {
      borderRight: '4px solid var(--harmony-n-400)'
    }
  ],
  '&.active': {
    color: 'var(--harmony-primary)',
    fontWeight: 'var(--harmony-font-medium)'
  },
  '&.active:before': [
    indicatorCss,
    {
      borderRight: '4px solid var(--harmony-primary)'
    }
  ]
}

const disabledDropCss: CSSInterpolation = {
  opacity: 0.6,
  cursor: 'not-allowed'
}

Text<'span'>

export const LeftNavLink = (props: LeftNavLinkProps) => {
  const { asChild, disabled, children, ...other } = props

  const css: Interpolation<Theme> = [
    {
      position: 'relative',
      height: `${spacing.xl}px`,
      display: 'flex',
      alignItems: 'center',
      gap: `${spacing.s}px`,
      minWidth: '100px',
      // Leaves space for the hover indicator
      paddingLeft: `${spacing.unit5}px`,
      paddingRight: `${spacing.l}px`,
      color: 'var(--harmony-neutral)',
      border: 0,
      background: 'none',
      textAlign: 'inherit'
    },
    linkInteractionCss,
    disabled && disabledDropCss
  ]

  const TextComp = asChild ? Slot : Text
  const textProps = asChild
    ? undefined
    : ({
        tag: 'span',
        size: 's',
        css: { display: 'flex', alignItems: 'center' }
      } as TextProps<'span'>)

  if ('to' in other) {
    return (
      <NavLink {...other} activeClassName='active' css={css}>
        <TextComp {...textProps}>{children}</TextComp>
      </NavLink>
    )
  }
  return (
    <div {...other} css={css}>
      <TextComp {...textProps}>{children}</TextComp>
    </div>
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
