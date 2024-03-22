import { Theme } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { accountSelectors, themeSelectors } from '@audius/common/store'
import { IconAudiusLogoHorizontal, useTheme, Flex } from '@audius/harmony'
import cn from 'classnames'
import { Link } from 'react-router-dom'

import { NavMenuButton } from 'components/nav/desktop/NavMenuButton'
import { useFlag } from 'hooks/useRemoteConfig'
import { useSelector } from 'utils/reducer'
import { HOME_PAGE } from 'utils/route'

import styles from './NavHeader.module.css'
import { NotificationsButton } from './NotificationsButton'

const { getAccountUser } = accountSelectors
const { getTheme } = themeSelectors

const messages = {
  earlyAccess: 'Early Access',
  homeLink: 'Go to Home'
}

export const NavHeader = () => {
  const { spacing } = useTheme()
  const account = useSelector(getAccountUser)

  const isMatrix = useSelector((state) => getTheme(state) === Theme.MATRIX)

  const { isEnabled: isEarlyAccess } = useFlag(FeatureFlags.EARLY_ACCESS)

  return (
    <div className={styles.header}>
      <Link to={HOME_PAGE} aria-label={messages.homeLink}>
        <IconAudiusLogoHorizontal
          color='subdued'
          sizeH='l'
          width='auto'
          css={{
            display: 'block',
            marginTop: spacing.l,
            marginBottom: spacing.l
          }}
          className={cn(styles.logo, { [styles.matrixLogo]: isMatrix })}
        />
      </Link>
      {isEarlyAccess ? (
        <div className={styles.earlyAccess}>{messages.earlyAccess}</div>
      ) : null}
      {account ? (
        <Flex justifyContent='center' alignItems='center' gap='s'>
          <NavMenuButton />
          <NotificationsButton />
        </Flex>
      ) : null}
    </div>
  )
}
