import { TrendingScreen } from 'app/screens/trending-screen'

import { AppTabScreenParamList } from './AppTabScreen'
import { createAppTabScreenStack } from './createAppTabScreenStack'

export type TrendingTabScreenParamList = AppTabScreenParamList & {
  TrendingStack: undefined
}

export const TrendingTabScreen = createAppTabScreenStack<
  TrendingTabScreenParamList
>(Stack => <Stack.Screen name='Trending' component={TrendingScreen} />)
