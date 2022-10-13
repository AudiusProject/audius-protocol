import { useContext } from 'react'

import { useNavigation } from 'app/hooks/useNavigation'

import type { AppTabScreenParamList } from '../app-screen'
import type { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

import { AppDrawerContext } from '.'

export const useAppDrawerNavigation = () => {
  const { drawerHelpers } = useContext(AppDrawerContext)
  return useNavigation<AppTabScreenParamList & ProfileTabScreenParamList>({
    customNativeNavigation: drawerHelpers
  })
}
