import { useContext, useMemo } from 'react'

import { FeatureFlags } from '@audius/common'

import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'

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

  const navigation = useNavigation()

  const notificationNavigation = useMemo(
    () => ({
      ...navigation,
      ...drawerHelpers
    }),
    [drawerHelpers, navigation]
  )

  if (isNavOverhaulEnabled) {
    notificationNavigation.navigate = notificationNavigation.push as any
  }

  return notificationNavigation
}

export const useAppDrawerNavigation = () => {
  const { drawerHelpers } = useContext(AppDrawerContext)

  const navigation = useNavigation()

  const drawerNavigation = useMemo(
    () => ({
      ...navigation,
      ...drawerHelpers
    }),
    [drawerHelpers, navigation]
  )

  return drawerNavigation
}
