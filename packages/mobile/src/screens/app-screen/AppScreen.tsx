import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { ChangePasswordModalScreen } from '../change-password-screen'
import { EditPlaylistModalScreen } from '../edit-playlist-screen'
import { EditTrackModalScreen } from '../edit-track-screen'
import { FeatureFlagOverrideModalScreen } from '../feature-flag-override-screen'
import { TipArtistModalScreen } from '../tip-artist-screen'
import { UploadModalScreen } from '../upload-screen'
import { WalletConnectModalScreen } from '../wallet-connect'

import { AppTabsScreen } from './AppTabsScreen'
import { ChangeEmailModalScreen } from '../change-email-screen/ChangeEmailScreen'

const Stack = createNativeStackNavigator()

export const AppScreen = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='AppTabs' component={AppTabsScreen} />
      <Stack.Group screenOptions={{ presentation: 'fullScreenModal' }}>
        <Stack.Screen name='TipArtist' component={TipArtistModalScreen} />
        <Stack.Screen name='Upload' component={UploadModalScreen} />
        <Stack.Screen name='EditTrack' component={EditTrackModalScreen} />
        <Stack.Screen name='EditPlaylist' component={EditPlaylistModalScreen} />
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
