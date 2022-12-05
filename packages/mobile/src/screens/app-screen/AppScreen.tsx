import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { EditExistingTrackScreen } from '../edit-track-screen'
import { TipArtistModal } from '../tip-artist-screen'
import { UploadScreen } from '../upload-screen'
import { WalletConnectScreen } from '../wallet-connect'

import { AppTabsScreen } from './AppTabsScreen'

const Stack = createNativeStackNavigator()
const modalScreenOptions = { presentation: 'fullScreenModal' as const }

export const AppScreen = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='AppTabs' component={AppTabsScreen} />
      <Stack.Screen
        name='TipArtist'
        component={TipArtistModal}
        options={modalScreenOptions}
      />
      <Stack.Screen
        name='Upload'
        component={UploadScreen}
        options={modalScreenOptions}
      />
      <Stack.Screen
        name='EditTrack'
        component={EditExistingTrackScreen}
        options={modalScreenOptions}
      />
      <Stack.Screen
        name='WalletConnect'
        component={WalletConnectScreen}
        options={modalScreenOptions}
      />
    </Stack.Navigator>
  )
}
