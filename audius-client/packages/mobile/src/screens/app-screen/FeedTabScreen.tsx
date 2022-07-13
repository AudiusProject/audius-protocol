import { FeedScreen } from 'app/screens/feed-screen'

import { AppTabScreenParamList } from './AppTabScreen'
import { createAppTabScreenStack } from './createAppTabScreenStack'

export type FeedTabScreenParamList = AppTabScreenParamList & {
  Feed: undefined
}

export const FeedTabScreen = createAppTabScreenStack<FeedTabScreenParamList>(
  (Stack) => <Stack.Screen name='Feed' component={FeedScreen} />
)
