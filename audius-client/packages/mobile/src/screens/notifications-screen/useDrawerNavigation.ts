import { useContext } from 'react'

import { useNavigation } from 'app/hooks/useNavigation'

import { AppTabScreenParamList } from '../app-screen'
import { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

import { NotificationsDrawerNavigationContext } from './NotificationsDrawerNavigationContext'

export const useDrawerNavigation = () => {
  const { drawerHelpers } = useContext(NotificationsDrawerNavigationContext)
  return useNavigation<AppTabScreenParamList & ProfileTabScreenParamList>({
    customNativeNavigation: drawerHelpers
  })
}
