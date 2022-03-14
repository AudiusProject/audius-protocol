import { createStackNavigator } from '@react-navigation/stack'
import { FavoriteType } from 'audius-client/src/common/models/Favorite'
import { ID } from 'audius-client/src/common/models/Identifiers'
import { NotificationType } from 'audius-client/src/common/store/notifications/types'
import { RepostType } from 'audius-client/src/common/store/user-list/reposts/types'
import { MessageType } from 'audius-client/src/services/native-mobile-interface/types'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { CollectionScreen } from 'app/screens/collection-screen/CollectionScreen'
import { ProfileScreen } from 'app/screens/profile-screen'
import {
  SearchResultsScreen,
  TagSearchScreen
} from 'app/screens/search-results-screen'
import { SearchScreen } from 'app/screens/search-screen'
import { TrackScreen } from 'app/screens/track-screen'
import {
  FavoritedScreen,
  FollowersScreen,
  FollowingScreen,
  RepostsScreen,
  NotificationUsersScreen
} from 'app/screens/user-list-screen'

import { useAppScreenOptions } from './useAppScreenOptions'

export type AppTabScreenParamList = {
  Track: { id: ID }
  Profile: { handle: string }
  Collection: { id: ID }
  Favorited: { id: ID; favoriteType: FavoriteType }
  Reposts: { id: ID; repostType: RepostType }
  Followers: { userId: ID }
  Following: { userId: ID }
  Search: undefined
  SearchResults: { query: string }
  TagSearch: { query: string }
  NotificationUsers: {
    id: string // uuid
    notificationType: NotificationType
    count: number
  }
}

const forFade = ({ current }) => ({
  cardStyle: {
    opacity: current.progress
  }
})

type AppTabScreenProps = {
  baseScreen: (
    Stack: ReturnType<typeof createStackNavigator>
  ) => React.ReactNode
  Stack: ReturnType<typeof createStackNavigator>
}

/**
 * This is the base tab screen that includes common screens
 * like track and profile
 */
export const AppTabScreen = ({ baseScreen, Stack }: AppTabScreenProps) => {
  const dispatchWeb = useDispatchWeb()
  const screenOptions = useAppScreenOptions()
  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      screenListeners={{
        beforeRemove: e => {
          // hack for now to prevent pop for some pages
          if (
            !e.target?.includes('EditProfile') &&
            !(
              e.target?.includes('Search') &&
              !e.target?.includes('SearchResults')
            )
          ) {
            // When a screen is removed, notify the web layer to pop navigation
            dispatchWeb({
              type: MessageType.POP_ROUTE
            })
          }
        }
      }}
    >
      {baseScreen(Stack)}
      <Stack.Screen name='Track' component={TrackScreen} />
      <Stack.Screen name='Collection' component={CollectionScreen} />
      <Stack.Screen name='Profile' component={ProfileScreen} />
      <Stack.Group>
        <Stack.Screen
          name='Search'
          component={SearchScreen}
          options={{ cardStyleInterpolator: forFade }}
        />
        <Stack.Screen name='SearchResults' component={SearchResultsScreen} />
        <Stack.Screen name='TagSearch' component={TagSearchScreen} />
      </Stack.Group>
      <Stack.Group>
        <Stack.Screen name='Followers' component={FollowersScreen} />
        <Stack.Screen name='Following' component={FollowingScreen} />
        <Stack.Screen name='Favorited' component={FavoritedScreen} />
        <Stack.Screen name='Reposts' component={RepostsScreen} />
        <Stack.Screen
          name='NotificationUsers'
          component={NotificationUsersScreen}
        />
      </Stack.Group>
    </Stack.Navigator>
  )
}
