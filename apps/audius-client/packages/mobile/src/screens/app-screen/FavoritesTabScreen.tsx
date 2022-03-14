import FavoritesScreen from 'app/screens/favorites-screen'

import { AppTabScreenParamList } from './AppTabScreen'
import { createAppTabScreenStack } from './createAppTabScreenStack'

export type FavoritesTabScreenParamList = AppTabScreenParamList & {
  FavoritesStack: undefined
}

export const FavoritesTabScreen = createAppTabScreenStack<
  FavoritesTabScreenParamList
>(Stack => <Stack.Screen name='Favorites' component={FavoritesScreen} />)
