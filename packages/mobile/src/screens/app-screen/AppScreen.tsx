import { FeatureFlags } from '@audius/common'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useFeatureFlag } from 'app/hooks/useRemoteConfig'

import { EditPlaylistModalScreen } from '../edit-playlist-screen'
import { EditTrackModalScreen } from '../edit-track-screen'
import { TipArtistModalScreen } from '../tip-artist-screen'
import { UploadModalScreen } from '../upload-screen'
import { WalletConnectModalScreen } from '../wallet-connect'

import { AppTabsScreen } from './AppTabsScreen'

const Stack = createNativeStackNavigator()
const modalScreenOptions = { presentation: 'fullScreenModal' as const }

export const AppScreen = () => {
  const { isEnabled: isPlaylistUpdatesEnabled } = useFeatureFlag(
    FeatureFlags.PLAYLIST_UPDATES_POST_QA
  )
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='AppTabs' component={AppTabsScreen} />
      <Stack.Screen
        name='TipArtist'
        component={TipArtistModalScreen}
        options={modalScreenOptions}
      />
      <Stack.Screen
        name='Upload'
        component={UploadModalScreen}
        options={modalScreenOptions}
      />
      <Stack.Screen
        name='EditTrack'
        component={EditTrackModalScreen}
        options={modalScreenOptions}
      />
      {isPlaylistUpdatesEnabled ? (
        <Stack.Screen
          name='EditPlaylist'
          component={EditPlaylistModalScreen}
          options={modalScreenOptions}
        />
      ) : null}
      <Stack.Screen
        name='WalletConnect'
        component={WalletConnectModalScreen}
        options={modalScreenOptions}
      />
    </Stack.Navigator>
  )
}
