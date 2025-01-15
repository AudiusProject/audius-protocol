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
      onClick?.(e)
    },
    [onClick, to],
    undefined,
    undefined,
    restriction
  )

  const handleClick = (e?: React.MouseEvent<Element>) => {
    if (!!e && !e.defaultPrevented) {
      if (to) {
        dispatch(
          make(Name.LINK_CLICKING, {
            url: to,
            source: 'left nav'
          })
        )
      }
      return requiresAccountOnClick(e)
    } else {
      e?.preventDefault()
    }
    return undefined
  }

  return (
    <NavLink to={to ?? ''} onClick={handleClick} draggable={false}>
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
