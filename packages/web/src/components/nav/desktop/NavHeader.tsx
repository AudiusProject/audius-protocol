import { Theme } from '@audius/common/models'
import { accountSelectors, themeSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { IconAudiusLogoHorizontal, useTheme, Flex } from '@audius/harmony'
import { Link } from 'react-router-dom'

import { NavMenuButton } from 'components/nav/desktop/NavMenuButton'
import { useSelector } from 'utils/reducer'

import { NotificationsButton } from './NotificationsButton'

const { HOME_PAGE } = route
const { getHasAccount } = accountSelectors
const { getTheme } = themeSelectors

const messages = {
  homeLink: 'Go to Home'
}

export const NavHeader = () => {
  const { spacing } = useTheme()
  const hasAccount = useSelector(getHasAccount)

  const isMatrix = useSelector((state) => getTheme(state) === Theme.MATRIX)

  return (
    <Flex
      alignItems='center'
      backgroundColor='white'
      borderBottom='default'
      justifyContent='space-between'
      p={spacing.l}
      flex={0}
      css={{ minHeight: 58 }}
    >
      <Link to={HOME_PAGE} aria-label={messages.homeLink}>
        <IconAudiusLogoHorizontal
          color='subdued'
          sizeH='l'
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
          <NavMenuButton />
          <NotificationsButton />
        </Flex>
      ) : null}
    </Flex>
  )
}
