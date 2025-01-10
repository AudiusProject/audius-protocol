import { accountSelectors } from '@audius/common/store'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { useSelector } from 'react-redux'

import { IconAudiusLogo, Flex } from '@audius/harmony-native'

import { AppDrawerContextProvider } from '../AppDrawerContext'

import { AccountDetails } from './AccountDetails'
import { LeftNavLink } from './LeftNavLink'
import { VanityMetrics } from './VanityMetrics'
import { useNavConfig } from './useNavConfig'

const { getHasAccount } = accountSelectors

type AccountDrawerProps = DrawerContentComponentProps & {
  gesturesDisabled: boolean
  setGesturesDisabled: (disabled: boolean) => void
}

export const LeftNavDrawer = (props: AccountDrawerProps) => {
  const { navigation: drawerHelpers, ...other } = props
  const hasAccount = useSelector(getHasAccount)
  if (!hasAccount) return null

  return (
    <AppDrawerContextProvider drawerHelpers={drawerHelpers} {...other}>
      <WrappedLeftNavDrawer />
    </AppDrawerContextProvider>
  )
}

const WrappedLeftNavDrawer = () => {
  const { navItems } = useNavConfig()

  return (
    <Flex h='95%' pt='unit16' justifyContent='space-between'>
      <Flex>
        <AccountDetails />
        <VanityMetrics />
        {navItems.map((item) => (
          <LeftNavLink
            key={item.label}
            icon={item.icon}
            label={item.label}
            to={item.to}
            params={item.params}
            onPress={item.onPress}
            showNotificationBubble={item.showNotificationBubble}
          >
            {item.rightIcon}
          </LeftNavLink>
        ))}
      </Flex>
      <IconAudiusLogo color='subdued' />
    </Flex>
  )
}
