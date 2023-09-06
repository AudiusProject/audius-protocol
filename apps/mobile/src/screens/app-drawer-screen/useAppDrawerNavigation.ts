import { useContext } from 'react'

import { useNavigation } from 'app/hooks/useNavigation'

import { AppTabNavigationContext } from '../app-screen'

export const useAppDrawerNavigation = () => {
  const { navigation: contextNavigation } = useContext(AppTabNavigationContext)
  return useNavigation({ customNavigation: contextNavigation })
}
