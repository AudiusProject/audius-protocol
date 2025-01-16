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
}

export const LeftNavLink = (props: LeftNavLinkProps) => {
  const { to, disabled, children, onClick, restriction, ...other } = props
  const location = useLocation()
  const dispatch = useDispatch()

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
        isSelected={to ? location.pathname.startsWith(to) : false}
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
