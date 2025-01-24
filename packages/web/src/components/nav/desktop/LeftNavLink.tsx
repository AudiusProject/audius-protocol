import { useMemo } from 'react'

import { Name } from '@audius/common/models'
import { NavItem, NavItemProps } from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { NavLink, useLocation } from 'react-router-dom'

import { make } from 'common/store/analytics/actions'
import {
  RestrictionType,
  useRequiresAccountOnClick
} from 'hooks/useRequiresAccount'

export type LeftNavLinkProps = Omit<NavItemProps, 'isSelected'> & {
  to?: string
  disabled?: boolean
  restriction?: RestrictionType
  exact?: boolean
}

export const LeftNavLink = (props: LeftNavLinkProps) => {
  const {
    to,
    disabled,
    children,
    onClick,
    restriction,
    exact = false,
    ...other
  } = props
  const location = useLocation()
  const dispatch = useDispatch()
  const isSelected = useMemo(() => {
    if (exact) {
      return to ? location.pathname === to : false
    }
    return to ? location.pathname.startsWith(to) : false
  }, [to, location.pathname, exact])

  const requiresAccountOnClick = useRequiresAccountOnClick(
    (e) => {
      // Only dispatch analytics if we're actually navigating
      if (to) {
        dispatch(
          make(Name.LINK_CLICKING, {
            url: to,
            source: 'left nav'
          })
        )
      }
      onClick?.(e)
    },
    [onClick, to, dispatch],
    undefined,
    undefined,
    restriction
  )

  return (
    <NavLink to={to ?? ''} onClick={requiresAccountOnClick} draggable={false}>
      <NavItem
        {...other}
        isSelected={isSelected}
        css={{
          opacity: disabled ? 0.5 : 1,
          cursor: 'pointer'
        }}
      >
        {children}
      </NavItem>
    </NavLink>
  )
}
