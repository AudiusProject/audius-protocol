import { NavItem, NavItemProps } from '@audius/harmony'
import { Link, useLocation } from 'react-router-dom'

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
    [onClick, to, history],
    undefined,
    undefined,
    restriction
  )

  const handleClick = (e?: React.MouseEvent<Element>) => {
    if (!disabled && !!e) {
      return requiresAccountOnClick(e)
    } else {
      e?.preventDefault()
    }
    return undefined
  }

  return (
    <Link
      to={to ?? ''}
      onClick={handleClick}
      style={{ pointerEvents: disabled ? 'none' : 'auto' }}
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
    </Link>
  )
}
