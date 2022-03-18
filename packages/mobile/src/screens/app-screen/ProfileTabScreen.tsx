import { AudioScreen } from 'app/screens/audio-screen'
import { EditProfileScreen } from 'app/screens/edit-profile-screen'
import { ProfileScreen } from 'app/screens/profile-screen'
import {
  AboutScreen,
  AccountSettingsScreen,
  ListeningHistoryScreen,
  NotificationSettingsScreen,
  SettingsScreen
} from 'app/screens/settings-screen'

import { AppTabScreenParamList } from './AppTabScreen'
import { createAppTabScreenStack } from './createAppTabScreenStack'

export type ProfileTabScreenParamList = AppTabScreenParamList & {
  ProfileStack: undefined
  EditProfile: undefined
  SettingsScreen: undefined
  AboutScreen: undefined
  ListeningHistoryScreen: undefined
  AccountSettingsScreen: undefined
  NotificationSettingsScreen: undefined
  AudioScreen: Record<string, unknown>
}

export const ProfileTabScreen = createAppTabScreenStack<
  ProfileTabScreenParamList
>(Stack => (
  <>
    <Stack.Screen
      name='UserProfile'
      component={ProfileScreen}
      initialParams={{ handle: 'accountUser' }}
    />
    <Stack.Screen name='EditProfile' component={EditProfileScreen} />
    <Stack.Screen name='SettingsScreen' component={SettingsScreen} />
    <Stack.Screen name='AboutScreen' component={AboutScreen} />
    <Stack.Screen
      name='ListeningHistoryScreen'
      component={ListeningHistoryScreen}
    />
    <Stack.Screen
      name='AccountSettingsScreen'
      component={AccountSettingsScreen}
    />
    <Stack.Screen
      name='NotificationSettingsScreen'
      component={NotificationSettingsScreen}
    />
    <Stack.Screen name='AudioScreen' component={AudioScreen} />
  </>
))
