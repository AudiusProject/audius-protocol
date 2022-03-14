import { ParamListBase } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

import { AppTabScreen } from './AppTabScreen'

/**
 * This function is used to create a stack containing common screens like
 * track and profile
 * @param baseScreen The screen to use as the base of the stack
 */
export const createAppTabScreenStack = <StackParamList extends ParamListBase>(
  baseScreen: (
    Stack: ReturnType<typeof createStackNavigator>
  ) => React.ReactNode
) => {
  const Stack = createStackNavigator<StackParamList>()
  return () => <AppTabScreen Stack={Stack} baseScreen={baseScreen} />
}
