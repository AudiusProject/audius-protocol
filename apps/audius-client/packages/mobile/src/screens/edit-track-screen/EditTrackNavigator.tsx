import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useAppScreenOptions } from 'app/screens/app-screen/useAppScreenOptions'

import { EditTrackForm } from './EditTrackForm'
import {
  AdvancedOptionsScreen,
  IsrcIswcScreen,
  LicenseTypeScreen,
  RemixSettingsScreen,
  SelectGenreScreen,
  SelectMoodScreen,
  TrackVisibilityScreen
} from './screens'
import type { EditTrackFormProps } from './types'

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

type EditTrackNavigatorProps = EditTrackFormProps

export const EditTrackNavigator = (props: EditTrackNavigatorProps) => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name='CompleteTrackForm'>
        {() => <EditTrackForm {...props} />}
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
