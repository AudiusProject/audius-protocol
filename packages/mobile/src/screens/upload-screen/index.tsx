import type { createNativeStackNavigator } from '@react-navigation/native-stack'

import { CompleteTrackScreen } from './CompleteTrackScreen'
import { UploadScreen } from './UploadScreen'

export * from './UploadScreen'
export * from './ParamList'

export const uploadScreens = (
  Stack: ReturnType<typeof createNativeStackNavigator>
) => (
  <Stack.Group>
    <Stack.Screen name='Upload' component={UploadScreen} />
    <Stack.Screen name='CompleteTrack' component={CompleteTrackScreen} />
  </Stack.Group>
)
