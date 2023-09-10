import { ProfileScreen } from 'app/screens/profile-screen'

import type { AppTabScreenParamList } from './AppTabScreen'
import { createAppTabScreenStack } from './createAppTabScreenStack'

export type ProfileTabScreenParamList = AppTabScreenParamList & {
  UserProfile: undefined
  EditProfile: undefined
}

export const ProfileTabScreen =
  createAppTabScreenStack<ProfileTabScreenParamList>((Stack) => (
    <Stack.Screen
      name='UserProfile'
      component={ProfileScreen}
      initialParams={{ handle: 'accountUser' }}
    />
  ))
