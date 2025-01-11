import { Theme } from '@audius/common/models'
import { accountSelectors, themeSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  Flex,
  IconAudiusLogo,
  IconDashboard,
  IconSettings,
  useTheme
} from '@audius/harmony'
import { Link } from 'react-router-dom'

import { useSelector } from 'utils/reducer'

import { NavHeaderButton } from './NavHeaderButton'
import { NotificationsButton } from './NotificationsButton'

const { HOME_PAGE, SETTINGS_PAGE, DASHBOARD_PAGE } = route
const { getHasAccount } = accountSelectors
const { getTheme } = themeSelectors

const messages = {
  homeLink: 'Go to Home',
  dashboardLabel: 'Go to Dashboard',
  settingsLabel: 'Go to Settings'
}

export const NavHeader = () => {
  const { spacing } = useTheme()
  const hasAccount = useSelector(getHasAccount)

  const isMatrix = useSelector((state) => getTheme(state) === Theme.MATRIX)

  return (
    <Flex
      alignItems='center'
      backgroundColor='surface1'
      justifyContent='space-between'
      p={spacing.l}
      flex={0}
      css={{ minHeight: 58 }}
    >
      <Link to={HOME_PAGE} aria-label={messages.homeLink}>
        <IconAudiusLogo
          color='subdued'
          size='2xl'
          width='auto'
          css={[
            {
              display: 'block'
            },
            isMatrix && {
              '& path': { fill: 'url(#matrixHeaderGradient) !important' }
            }
          ]}
        />
      </Link>
      {hasAccount ? (
        <Flex justifyContent='center' alignItems='center' gap='s'>
          <Link to={DASHBOARD_PAGE}>
            <NavHeaderButton
              icon={IconDashboard}
              aria-label={messages.dashboardLabel}
              isActive={location.pathname === DASHBOARD_PAGE}
            />
          </Link>
          <Link to={SETTINGS_PAGE}>
            <NavHeaderButton
              icon={IconSettings}
              aria-label={messages.settingsLabel}
              isActive={location.pathname === SETTINGS_PAGE}
            />
          </Link>
          <NotificationsButton />
        </Flex>
      ) : null}
    </Flex>
  )
}
