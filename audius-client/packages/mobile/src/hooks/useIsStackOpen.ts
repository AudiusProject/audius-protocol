import { useNavigationState } from '@react-navigation/native'

import { getNavigationStateAtRoute } from 'app/utils/navigation'

/**
 * Hook that returns whether the StackNavigator nested in the top level
 * TabNavigator is open
 * @returns boolean
 */
const useIsStackOpen = () => {
  const state = useNavigationState(getNavigationStateAtRoute(['main']))

  if (!state) {
    return false
  }

  const activeRoute = state.routes[state.index]
  return activeRoute.state?.index > 0
}

export default useIsStackOpen
