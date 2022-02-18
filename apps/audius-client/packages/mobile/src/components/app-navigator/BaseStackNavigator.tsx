import {
  CardStyleInterpolators,
  createStackNavigator
} from '@react-navigation/stack'
import { MessageType } from 'audius-client/src/services/native-mobile-interface/types'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { EditProfileScreen } from 'app/screens/edit-profile-screen/EditProfileScreen'
import { ProfileScreen } from 'app/screens/profile-screen'
import { TrackScreen } from 'app/screens/track-screen'
import { FavoritedScreen, FollowersScreen } from 'app/screens/user-list-screen'

import { TopBar } from './TopBar'

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
          // When a screen is removed, notify the web layer to pop navigation
          dispatchWeb({
            type: MessageType.POP_ROUTE
          })
        }
      })}
    >
      {baseScreen(Stack)}
      <Stack.Screen name='track' component={TrackScreen} />
      <Stack.Screen name='profile' component={ProfileScreen} />
      <Stack.Screen name='EditProfile' component={EditProfileScreen} />
      <Stack.Group>
        <Stack.Screen name='FollowersScreen' component={FollowersScreen} />
        <Stack.Screen name='FavoritedScreen' component={FavoritedScreen} />
      </Stack.Group>
    </Stack.Navigator>
  )
}
