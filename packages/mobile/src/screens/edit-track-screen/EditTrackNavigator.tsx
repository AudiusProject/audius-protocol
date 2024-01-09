import { FeatureFlags } from '@audius/common'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { GatedContentUploadPromptDrawer } from 'app/components/gated-content-upload-prompt-drawer'
import { SupportersInfoDrawer } from 'app/components/supporters-info-drawer'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { useAppScreenOptions } from 'app/screens/app-screen/useAppScreenOptions'

import { messages as completeMessages } from '../upload-screen/screens/CompleteTrackScreen'

import { EditTrackForm } from './EditTrackForm'
import { accessAndSaleScreenName } from './fields'
import {
  AccessAndSaleScreen,
  AdvancedOptionsScreen,
  IsrcIswcScreen,
  LicenseTypeScreen,
  RemixSettingsScreen,
  SelectGenreScreen,
  SelectMoodScreen,
  ReleaseDateScreen
} from './screens'
import { NFTCollectionsScreen } from './screens/NFTCollectionsScreen'
import type { EditTrackFormProps } from './types'

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

type EditTrackNavigatorProps = EditTrackFormProps

export const EditTrackNavigator = (props: EditTrackNavigatorProps) => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)
  const { isEnabled: isScheduledReleasesEnabled } = useFeatureFlag(
    FeatureFlags.SCHEDULED_RELEASES
  )

  return (
    <>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name='CompleteTrackForm'>
          {() => <EditTrackForm {...props} />}
        </Stack.Screen>
        <Stack.Screen name='SelectGenre' component={SelectGenreScreen} />
        <Stack.Screen name='SelectMood' component={SelectMoodScreen} />
        <Stack.Screen name='RemixSettings' component={RemixSettingsScreen} />
        {isScheduledReleasesEnabled ? (
          <Stack.Screen
            name='ReleaseDate'
            component={ReleaseDateScreen}
            initialParams={{
              isInitiallyUnlisted:
                props.doneText === completeMessages.done
                  ? true
                  : props.initialValues.is_unlisted
            }}
          />
        ) : null}
        <Stack.Screen
          name='AdvancedOptions'
          component={AdvancedOptionsScreen}
        />
        <Stack.Screen
          name={accessAndSaleScreenName}
          component={AccessAndSaleScreen}
        />
        <Stack.Screen name='NFTCollections' component={NFTCollectionsScreen} />
        <Stack.Screen name='IsrcIswc' component={IsrcIswcScreen} />
        <Stack.Screen name='LicenseType' component={LicenseTypeScreen} />
      </Stack.Navigator>
      <GatedContentUploadPromptDrawer
        isUpload={!props.initialValues.track_id}
      />
      <SupportersInfoDrawer />
    </>
  )
}
