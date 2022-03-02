import {
  CardStyleInterpolators,
  createStackNavigator
} from '@react-navigation/stack'
import { MessageType } from 'audius-client/src/services/native-mobile-interface/types'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { CollectionScreen } from 'app/screens/collection-screen/CollectionScreen'
import { ProfileScreen } from 'app/screens/profile-screen'
import { SearchResultsScreen } from 'app/screens/search-results-screen'
import { SearchScreen } from 'app/screens/search-screen'
import { TrackScreen } from 'app/screens/track-screen'
import {
  FavoritedScreen,
  FollowersScreen,
  FollowingScreen,
  RepostsScreen
} from 'app/screens/user-list-screen'

import { TopBar } from './TopBar'

const forFade = ({ current }) => ({
  cardStyle: {
    opacity: current.progress
  }
})

type BaseNavigatorProps = {
  baseScreen: (
    Stack: ReturnType<typeof createStackNavigator>
  ) => React.ReactNode
  Stack: ReturnType<typeof createStackNavigator>
}

/**
 * This is the base stack that includes common screens
 * like track and profile
 */
export const BaseStackNavigator = ({
  baseScreen,
  Stack
}: BaseNavigatorProps) => {
  const dispatchWeb = useDispatchWeb()
  return (
    <Stack.Navigator
      screenOptions={{
        cardOverlayEnabled: true,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureEnabled: true,
        gestureResponseDistance: 1000,
        header: props => <TopBar {...props} />,
        headerStyle: { height: 87 },
        headerMode: 'float'
      }}
      screenListeners={({ navigation }) => ({
        beforeRemove: e => {
          // hack for now to prevent pop for some pages
          if (!e.target?.includes('EditProfile')) {
            // When a screen is removed, notify the web layer to pop navigation
            dispatchWeb({
              type: MessageType.POP_ROUTE
            })
          }
        }
      })}
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
      </Stack.Group>
      <Stack.Group>
        <Stack.Screen name='FollowersScreen' component={FollowersScreen} />
        <Stack.Screen name='FollowingScreen' component={FollowingScreen} />
        <Stack.Screen name='FavoritedScreen' component={FavoritedScreen} />
        <Stack.Screen name='RepostsScreen' component={RepostsScreen} />
      </Stack.Group>
    </Stack.Navigator>
  )
}
