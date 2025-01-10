import { NavItem, NavItemProps } from '@audius/harmony'
import { NavLink, useLocation } from 'react-router-dom'

import {
  RestrictionType,
  useRequiresAccountOnClick
} from 'hooks/useRequiresAccount'

export type LeftNavLinkProps = Omit<NavItemProps, 'isSelected'> & {
  to?: string
  disabled?: boolean
  restriction?: RestrictionType
}

export const LeftNavLink = (props: LeftNavLinkProps) => {
  const { to, disabled, children, onClick, restriction, ...other } = props
  const location = useLocation()

  const requiresAccountOnClick = useRequiresAccountOnClick(
    (e) => {
      onClick?.(e)
    },
    [onClick, to],
    undefined,
    undefined,
    restriction
  )

  const handleClick = (e?: React.MouseEvent<Element>) => {
    if (!disabled && !!e && !e.defaultPrevented) {
      return requiresAccountOnClick(e)
    } else {
      e?.preventDefault()
    }
    return undefined
  }

  return (
    <NavLink
      to={to ?? ''}
      onClick={handleClick}
      style={{ pointerEvents: disabled ? 'none' : 'auto' }}
      draggable={false}
    >
      <NavItem
        {...other}
        isSelected={to ? location.pathname === to : false}
        css={{
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        {children}
      </NavItem>
    </NavLink>
  )
}
