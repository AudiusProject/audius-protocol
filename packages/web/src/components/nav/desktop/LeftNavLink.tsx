import { ComponentProps } from 'react'

import { Text, TextProps, spacing } from '@audius/harmony'
import { CSSInterpolation } from '@emotion/css'
import { Interpolation, Theme } from '@emotion/react'
import cn from 'classnames'
import { NavLink, NavLinkProps } from 'react-router-dom'
import { SetOptional } from 'type-fest'

import { Droppable, DroppableProps } from 'components/dragndrop'
import { selectDragnDropState } from 'store/dragndrop/slice'
import { useSelector } from 'utils/reducer'

import styles from './LeftNavLink.module.css'

export type LeftNavLinkProps =
  | { disabled?: boolean } & (
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

const enabledCss: CSSInterpolation = {
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

const disabledCss: CSSInterpolation = {
  '&,:hover': {
    color: 'var(--harmony-n-400)',
    pointerEvents: 'none'
  }
}

export const LeftNavLink = (props: LeftNavLinkProps) => {
  const { disabled, children, ...other } = props

  const css: Interpolation<Theme> = [
    {
      position: 'relative',
      height: `${spacing.xl}px`,
      display: 'flex',
      alignItems: 'center',
      gap: `${spacing.s}px`,
      minWidth: '100px',
      paddingLeft: `${spacing.l}px`,
      paddingRight: `${spacing.l}px`,
      color: 'var(--harmony-neutral)',
      border: 0,
      background: 'none',
      textAlign: 'inherit'
    },
    disabled ? disabledCss : enabledCss
  ]

  const textProps: TextProps = {
    ellipses: true,
    size: 's'
  }

  const textLayoutProps: Interpolation<Theme> = {
    display: 'flex',
    alignItems: 'center'
  }

  if ('to' in other) {
    return (
      <NavLink {...other} activeClassName='active' css={css}>
        <Text tag='span' css={textLayoutProps} {...textProps}>
          {children}
        </Text>
      </NavLink>
    )
  }
  return (
    <div {...other} css={css}>
      <Text tag='span' css={textLayoutProps} {...textProps}>
        {children}
      </Text>
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
