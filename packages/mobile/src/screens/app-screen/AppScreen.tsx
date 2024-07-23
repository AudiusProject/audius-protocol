import { MobileOS } from '@audius/common/models'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Platform } from 'react-native'

import { ChangeEmailModalScreen } from '../change-email-screen/ChangeEmailScreen'
import { ChangePasswordModalScreen } from '../change-password-screen'
import { EditCollectionScreen } from '../edit-collection-screen'
import { EditTrackModalScreen } from '../edit-track-screen'
import { FeatureFlagOverrideModalScreen } from '../feature-flag-override-screen'
import { TipArtistModalScreen } from '../tip-artist-screen'
import { UploadModalScreen } from '../upload-screen'
import { WalletConnectModalScreen } from '../wallet-connect'

import { AppTabsScreen } from './AppTabsScreen'

const Stack = createNativeStackNavigator()

export const AppScreen = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='AppTabs' component={AppTabsScreen} />
      <Stack.Group screenOptions={{ presentation: 'fullScreenModal' }}>
        <Stack.Screen
          name='TipArtist'
          component={TipArtistModalScreen}
          // Drop animation on android to fix blank tip screen
          options={
            Platform.OS === MobileOS.ANDROID ? { animation: 'none' } : undefined
          }
        />
        <Stack.Screen name='Upload' component={UploadModalScreen} />
        <Stack.Screen name='EditTrack' component={EditTrackModalScreen} />
        <Stack.Screen name='EditCollection' component={EditCollectionScreen} />
        <Stack.Screen
          name='WalletConnect'
          component={WalletConnectModalScreen}
        />
        <Stack.Screen
          name='FeatureFlagOverride'
          component={FeatureFlagOverrideModalScreen}
        />
        <Stack.Screen
          name='ChangePassword'
          component={ChangePasswordModalScreen}
        />
        <Stack.Screen name='ChangeEmail' component={ChangeEmailModalScreen} />
      </Stack.Group>
    </Stack.Navigator>
  )
}
