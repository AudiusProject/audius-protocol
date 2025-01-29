import { MouseEvent, ReactNode } from 'react'

import { accountSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  Flex,
  IconAudiusLogoHorizontalNew,
  IconDashboard,
  IconSettings
} from '@audius/harmony'
import { Link } from 'react-router-dom'

import { RestrictionType, useRequiresAccountFn } from 'hooks/useRequiresAccount'
import { useSelector } from 'utils/reducer'

import { NavHeaderButton } from './NavHeaderButton'
import { NotificationsButton } from './NotificationsButton'

const { HOME_PAGE, SETTINGS_PAGE, DASHBOARD_PAGE } = route
const { getHasAccount, getIsAccountComplete, getAccountUser } = accountSelectors

const messages = {
  homeLink: 'Go to Home',
  dashboardLabel: 'Go to Dashboard',
  settingsLabel: 'Go to Settings'
}

type RestrictedLinkProps = {
  to: string
  restriction?: RestrictionType
  children: ReactNode
}

export const canAccess = (
  restriction: RestrictionType,
  hasAccount: boolean,
  isAccountComplete: boolean
): boolean => {
  if (restriction === 'none') return true
  if (restriction === 'guest') return hasAccount
  return isAccountComplete
}

const RestrictedLink = ({
  to,
  restriction = 'none',
  children
}: RestrictedLinkProps) => {
  const { requiresAccount } = useRequiresAccountFn(undefined, restriction)
  const hasAccount = useSelector(getHasAccount)
  const isAccountComplete = useSelector(getIsAccountComplete)

  const handleClick = (e: MouseEvent) => {
    if (restriction === 'none') return

    const canAccessRoute = canAccess(restriction, hasAccount, isAccountComplete)
    if (!canAccessRoute) {
      e.preventDefault()
      requiresAccount()
    }
  }

  return (
    <Link to={to} onClick={handleClick}>
      {children}
    </Link>
  )
}

export const NavHeader = () => {
  const accountUser = useSelector(getAccountUser)

  return (
    <Flex
      alignItems='center'
      backgroundColor='surface1'
      justifyContent='space-between'
      pv='l'
      ph='m'
      flex={0}
      css={{ minHeight: 58 }}
    >
      <Link to={HOME_PAGE} aria-label={messages.homeLink}>
        <IconAudiusLogoHorizontalNew color='subdued' size='m' width='auto' />
      </Link>
      <Flex justifyContent='center' alignItems='center'>
        {accountUser?.track_count ? (
          <RestrictedLink to={DASHBOARD_PAGE} restriction='account'>
            <NavHeaderButton
              icon={IconDashboard}
              aria-label={messages.dashboardLabel}
              isActive={location.pathname === DASHBOARD_PAGE}
            />
          </RestrictedLink>
        ) : null}
        <RestrictedLink to={SETTINGS_PAGE} restriction='account'>
          <NavHeaderButton
            icon={IconSettings}
            aria-label={messages.settingsLabel}
            isActive={location.pathname === SETTINGS_PAGE}
          />
        </RestrictedLink>
        <NotificationsButton />
      </Flex>
    </Flex>
  )
}
