import { useContext } from 'react'

import { FeatureFlags } from '@audius/common'

import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'

import type { AppTabScreenParamList } from '../app-screen'
import type { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

import { AppDrawerContext } from '.'

/** Temporary navigation hook for notification components.
 * When MOBILE_NAV_OVERHAUL is true, use the normal nav
 * Otherwise, use the native-drawer-nav
 */
export const useNotificationNavigation = () => {
  const { drawerHelpers } = useContext(AppDrawerContext)
  const { isEnabled: isNavOverhaulEnabled } = useFeatureFlag(
    FeatureFlags.MOBILE_NAV_OVERHAUL
  )

  const navigationOptions = isNavOverhaulEnabled
    ? undefined
    : {
        customNativeNavigation: drawerHelpers
      }

  const navigation = useNavigation<
    AppTabScreenParamList & ProfileTabScreenParamList
  >(navigationOptions)

  if (isNavOverhaulEnabled) {
    navigation.navigate = navigation.push
  }

  return navigation
}

export const useAppDrawerNavigation = () => {
  const { drawerHelpers } = useContext(AppDrawerContext)

  return useNavigation<AppTabScreenParamList & ProfileTabScreenParamList>({
    customNativeNavigation: drawerHelpers
  })
}
