import type { createNativeStackNavigator } from '@react-navigation/native-stack'

import { CompleteTrackScreen } from './CompleteTrackScreen'
import { UploadCompleteScreen } from './UploadCompleteScreen'
import { UploadScreen } from './UploadScreen'
import { UploadingTracksScreen } from './UploadingTracksScreen'

export * from './UploadScreen'
export * from './ParamList'

export const uploadScreens = (
  Stack: ReturnType<typeof createNativeStackNavigator>
) => (
  <Stack.Group>
    <Stack.Screen name='Upload' component={UploadScreen} />
    <Stack.Screen name='CompleteTrack' component={CompleteTrackScreen} />
    <Stack.Screen name='UploadingTracks' component={UploadingTracksScreen} />
    <Stack.Screen name='UploadComplete' component={UploadCompleteScreen} />
  </Stack.Group>
)
