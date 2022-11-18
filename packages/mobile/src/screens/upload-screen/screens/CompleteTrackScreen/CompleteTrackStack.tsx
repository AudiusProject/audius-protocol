import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { FormikProps } from 'formik'

import { useAppScreenOptions } from 'app/screens/app-screen/useAppScreenOptions'

import {
  AdvancedOptionsScreen,
  IsrcIswcScreen,
  LicenseTypeScreen,
  RemixSettingsScreen,
  SelectGenreScreen,
  SelectMoodScreen,
  TrackVisibilityScreen
} from '..'
import type { FormValues } from '../../types'

import { CompleteTrackForm } from './CompleteTrackForm'

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

export const CompleteTrackStack = (props: FormikProps<FormValues>) => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name='CompleteTrackForm'>
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
