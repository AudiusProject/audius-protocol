import type { TrackMetadata } from '@audius/common'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { FormikProps } from 'formik'

import { useAppScreenOptions } from '../app-screen/useAppScreenOptions'

import { CompleteTrackForm } from './CompleteTrackScreen'
import {
  AdvancedOptionsScreen,
  IsrcIswcScreen,
  LicenseTypeScreen,
  RemixSettingsScreen,
  SelectGenreScreen,
  SelectMoodScreen,
  TrackVisibilityScreen
} from './screens'

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

export const CompleteTrackStack = (props: FormikProps<TrackMetadata>) => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name='CompleteTrack'>
        {() => <CompleteTrackForm {...props} />}
      </Stack.Screen>
      <Stack.Screen name='SelectGenre' component={SelectGenreScreen} />
      <Stack.Screen name='SelectMood' component={SelectMoodScreen} />
      <Stack.Screen name='RemixSettings' component={RemixSettingsScreen} />
      <Stack.Screen name='AdvancedOptions' component={AdvancedOptionsScreen} />
      <Stack.Screen name='TrackVisibility' component={TrackVisibilityScreen} />
      <Stack.Screen name='IsrcIswc' component={IsrcIswcScreen} />
      <Stack.Screen name='LicenseType' component={LicenseTypeScreen} />
    </Stack.Navigator>
  )
}
